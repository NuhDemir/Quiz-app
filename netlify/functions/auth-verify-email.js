const connectDB = require("./db");
const User = require("../../models/User");
const {
  respond,
  parseBody,
  createHttpError,
  handleError,
} = require("./auth-helpers");

// POST /.netlify/functions/auth-verify-email { token }
exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return respond(204, {});
  if (event.httpMethod !== "POST")
    return respond(405, { error: "Method Not Allowed" });
  try {
    await connectDB();
    const body = parseBody(event.body);
    const token = body.token?.trim();
    if (!token) throw createHttpError(400, "token is required");

    const user = await User.findOne({ emailVerificationToken: token });
    if (!user) throw createHttpError(400, "Invalid or expired token");
    if (user.emailVerified) return respond(200, { alreadyVerified: true });
    if (
      user.emailVerificationExpires &&
      user.emailVerificationExpires < new Date()
    ) {
      throw createHttpError(400, "Verification token expired");
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return respond(200, { verified: true });
  } catch (error) {
    return handleError(error, "auth-verify-email");
  }
};
