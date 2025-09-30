const connectDB = require("./db");
const crypto = require("crypto");
const User = require("../../models/User");
const {
  respond,
  parseBody,
  createHttpError,
  handleError,
} = require("./auth-helpers");
const { sendEmail } = require("./email");

// POST /.netlify/functions/auth-resend-verification { email }
// Rate limiting (simple): prevent resend if existing token not expired (<10m remaining threshold optional)
module.exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return respond(204, {});
  if (event.httpMethod !== "POST")
    return respond(405, { error: "Method Not Allowed" });
  try {
    await connectDB();
    const body = parseBody(event.body);
    const email = body.email?.trim().toLowerCase();
    if (!email) throw createHttpError(400, "Email is required");

    const user = await User.findOne({ email });
    if (!user) {
      // Sabit yanıt: enumeration engelle
      return respond(200, {
        message: "If the email exists a verification was (re)sent.",
      });
    }

    if (user.emailVerified) {
      return respond(200, { alreadyVerified: true });
    }

    // Eğer token hâlâ geçerli ve 5 dakikadan fazla süresi varsa yeniden üretmeden aynı mesajı dön
    if (
      user.emailVerificationToken &&
      user.emailVerificationExpires &&
      user.emailVerificationExpires > new Date(Date.now() + 5 * 60 * 1000)
    ) {
      return respond(200, {
        message: "Verification email already sent recently.",
      });
    }

    const newToken = crypto.randomBytes(24).toString("hex");
    user.emailVerificationToken = newToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const appUrl = process.env.APP_URL || "http://localhost:8888";
    const verifyLink = `${appUrl}/verify-email/confirm?token=${newToken}`;

    try {
      await sendEmail({
        to: email,
        subject: "E-postanı Doğrula (Tekrar) | Quiz App",
        text: `Hesabını doğrulamak için bağlantı:\n${verifyLink}`,
        html: `<p>Hesabını doğrulamak için <a href="${verifyLink}">buraya tıkla</a>.</p><p>Bağlantı 24 saat geçerlidir.</p>`,
      });
    } catch (e) {
      console.error("resend verification email failed", e.message);
    }

    return respond(200, {
      message: "If the email exists a verification was (re)sent.",
    });
  } catch (error) {
    return handleError(error, "auth-resend-verification");
  }
};
