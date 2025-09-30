const connectDB = require("./db");
const User = require("../../models/User");
const {
  respond,
  parseBody,
  extractBearerToken,
  verifyToken,
  createHttpError,
  handleError,
} = require("./auth-helpers");

// POST /.netlify/functions/settings-update { notifications?, sound?, language?, theme? }
exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return respond(204, {});
  if (event.httpMethod !== "POST")
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
    const body = parseBody(event.body);
    const allowedKeys = ["notifications", "sound", "language", "theme"]; // whitelist
    const newSettings = { ...(user.settings || {}) };
    for (const key of allowedKeys) {
      if (key in body) newSettings[key] = body[key];
    }
    // Basic validation
    if (newSettings.language && !["tr", "en"].includes(newSettings.language)) {
      throw createHttpError(400, "Invalid language");
    }
    if (newSettings.theme && !["light", "dark"].includes(newSettings.theme)) {
      throw createHttpError(400, "Invalid theme");
    }
    await User.updateOne(
      { _id: user._id },
      { $set: { settings: newSettings } }
    );
    return respond(200, { settings: newSettings });
  } catch (error) {
    return handleError(error, "settings-update");
  }
};
