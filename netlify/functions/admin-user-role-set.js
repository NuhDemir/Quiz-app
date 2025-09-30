const connectDB = require("./db");
const User = require("../../models/User");
const {
  extractBearerToken,
  verifyToken,
  createHttpError,
  respond,
  handleError,
} = require("./auth-helpers");

// POST /.netlify/functions/admin-user-role-set
// Body: { userId, role }
// Only admin can update roles. Cannot demote last admin.
exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return respond(204, {});
  if (event.httpMethod !== "POST")
    return respond(405, { error: "Method Not Allowed" });
  try {
    await connectDB();
    const token = extractBearerToken(event);
    if (!token) throw createHttpError(401, "Unauthorized");
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      throw createHttpError(401, "Invalid token");
    }
    const requester = await User.findById(decoded.sub);
    if (!requester) throw createHttpError(401, "Requester not found");
    if (requester.role !== "admin") throw createHttpError(403, "Forbidden");

    const { userId, role } = JSON.parse(event.body || "{}");
    if (!userId || !role)
      throw createHttpError(400, "userId and role required");
    if (!["user", "admin"].includes(role))
      throw createHttpError(400, "Invalid role");

    const target = await User.findById(userId);
    if (!target) throw createHttpError(404, "Target user not found");

    if (target.role === role) {
      return respond(200, {
        updated: false,
        message: "Role unchanged",
        user: { id: target._id.toString(), role: target.role },
      });
    }

    // Prevent demoting last admin
    if (target.role === "admin" && role === "user") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        throw createHttpError(400, "Cannot demote the last remaining admin");
      }
    }

    target.role = role;
    await target.save();

    return respond(200, {
      updated: true,
      user: { id: target._id.toString(), role: target.role },
    });
  } catch (error) {
    return handleError(error, "admin-user-role-set");
  }
};
