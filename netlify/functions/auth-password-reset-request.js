const crypto = require("crypto");
const connectDB = require("./db");
const User = require("../../models/User");
const {
  respond,
  parseBody,
  createHttpError,
  handleError,
} = require("./auth-helpers");
const { sendEmail } = require("./email");

// POST /.netlify/functions/auth-password-reset-request { email }
// Her zaman generic response döner (enumeration koruması)
module.exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return respond(204, {});
  if (event.httpMethod !== "POST")
    return respond(405, { error: "Method Not Allowed" });
  try {
    await connectDB();
    const body = parseBody(event.body);
    const rawEmail = body.email?.trim().toLowerCase();
    if (!rawEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      throw createHttpError(400, "Valid email is required");
    }

    const user = await User.findOne({ email: rawEmail });

    // Her durumda sabit süre bekleme (basit timing mitigation)
    const start = Date.now();

    let devToken;
    if (user) {
      const rawToken = crypto.randomBytes(24).toString("hex");
      const hashed = crypto.createHash("sha256").update(rawToken).digest("hex");
      user.passwordResetToken = hashed;
      user.passwordResetExpires = new Date(Date.now() + 1000 * 60 * 60); // 1h
      await user.save();
      devToken = rawToken; // dev ortamı için
      // E-posta gönder (try/catch swallow - enumeration leak etme)
      const appUrl =
        process.env.APP_URL?.replace(/\/$/, "") || "http://localhost:8888";
      const resetLink = `${appUrl}/reset-password?token=${rawToken}`;
      const html = `<!DOCTYPE html><html lang="tr"><body style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
        <h2>Parola Sıfırlama İsteği</h2>
        <p>Bir parola sıfırlama talebi aldık. Eğer bu isteği siz yapmadıysanız bu e-postayı dikkate almayın.</p>
        <p><a href="${resetLink}" style="display:inline-block;background:#0077ff;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">Parolamı Sıfırla</a></p>
        <p>Buton çalışmıyorsa bu bağlantıyı kopyalayın:<br><span style="font-size:12px;color:#555">${resetLink}</span></p>
        <p><strong>Bağlantı 1 saat içinde geçerlidir.</strong></p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="font-size:12px;color:#666">Bu e-posta otomatik gönderildi, cevaplamayın.</p>
      </body></html>`;
      const text = `Parolanızı sıfırlamak için bağlantı:\n${resetLink}\n\nEğer bu isteği siz yapmadıysanız yok sayabilirsiniz.`;
      try {
        await sendEmail({
          to: rawEmail,
          subject: "Parola Sıfırlama Bağlantısı",
          html,
          text,
        });
      } catch (mailErr) {
        console.warn(
          "[password-reset-request] Email send failed:",
          mailErr.message
        );
        // Email hatası dışarı propagate edilmez.
      }
    }

    const elapsed = Date.now() - start;
    if (elapsed < 150) {
      await new Promise((r) => setTimeout(r, 150 - elapsed));
    }

    const baseResponse = {
      message: "Eğer e-posta kayıtlıysa sıfırlama bağlantısı gönderildi",
    };
    // Geliştirme kolaylığı: raw token döndür (production'da kaldır)
    if (process.env.NODE_ENV !== "production" && devToken) {
      baseResponse.devResetToken = devToken;
    }
    return respond(200, baseResponse);
  } catch (error) {
    return handleError(error, "auth-password-reset-request");
  }
};
