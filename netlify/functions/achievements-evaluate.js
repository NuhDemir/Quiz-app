const connectDB = require("./db");
const User = require("../../models/User");
// Ensure related models registered
require("../../models/Badge");
require("../../models/Achievement");
const { evaluateAchievements } = require("./achievements-engine");
const {
  extractBearerToken,
  verifyToken,
  respond,
  createHttpError,
  handleError,
} = require("./auth-helpers");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return respond(204, {});
  if (event.httpMethod !== "POST")
    return respond(405, { error: "Method Not Allowed" });
  try {
    await connectDB();
    const token = extractBearerToken(event);
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.sub);
    if (!user) throw createHttpError(404, "User not found");

    const { newlyAwarded, mutated } = await evaluateAchievements(user);
    if (mutated) await user.save();
    return respond(200, { success: true, newlyAwarded });
  } catch (error) {
    return handleError(error, "achievements-evaluate");
  }
};
