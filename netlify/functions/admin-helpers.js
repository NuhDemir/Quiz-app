const User = require("../../models/User");
const {
  extractBearerToken,
  verifyToken,
  createHttpError,
} = require("./auth-helpers");

async function requireAdmin(event) {
  const token = extractBearerToken(event);
  if (!token) {
    throw createHttpError(401, "Authorization header missing");
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (error) {
    throw createHttpError(401, "Invalid or expired token");
  }

  const userId = decoded.sub || decoded.id || decoded._id;
  if (!userId) {
    throw createHttpError(400, "Token payload invalid");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw createHttpError(401, "User not found");
  }
  if (user.role !== "admin") {
    throw createHttpError(403, "Forbidden: admin role required");
  }

  return user;
}

module.exports = {
  requireAdmin,
};
