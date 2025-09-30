const connectDB = require("./db");
const User = require("../../models/User");
const {
  respond,
  extractBearerToken,
  verifyToken,
  createHttpError,
  handleError,
} = require("./auth-helpers");

// GET /.netlify/functions/settings-get
exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return respond(204, {});
  if (event.httpMethod !== "GET")
    return respond(405, { error: "Method Not Allowed" });
  try {
    await connectDB();
    const token = extractBearerToken(event);
    if (!token) throw createHttpError(401, "Unauthorized");
    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw createHttpError(401, "Invalid or expired token");
    }
    const user = await User.findById(payload.sub);
    if (!user) throw createHttpError(404, "User not found");
    return respond(200, { settings: user.settings || {} });
  } catch (error) {
    return handleError(error, "settings-get");
  }
};
