const crypto = require("crypto");
const connectDB = require("./db");
const User = require("../../models/User");
const {
  respond,
  parseBody,
  createHttpError,
  hashPassword,
  handleError,
} = require("./auth-helpers");

// POST /.netlify/functions/auth-password-reset { token, password }
module.exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return respond(204, {});
  if (event.httpMethod !== "POST")
    return respond(405, { error: "Method Not Allowed" });
  try {
    await connectDB();
    const body = parseBody(event.body);
    const token = body.token?.trim();
    const newPassword = body.password;

    if (!token) throw createHttpError(400, "token is required");
    if (!newPassword || newPassword.length < 8) {
      throw createHttpError(400, "Password must be at least 8 characters long");
    }

    const hashed = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashed,
      passwordResetExpires: { $gt: new Date() },
    });
    if (!user) throw createHttpError(400, "Invalid or expired reset token");

    user.passwordHash = await hashPassword(newPassword);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return respond(200, { message: "Password reset successful" });
  } catch (error) {
    return handleError(error, "auth-password-reset");
  }
};
