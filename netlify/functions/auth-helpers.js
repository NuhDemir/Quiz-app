const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};

const respond = (statusCode, payload = {}) => ({
  statusCode,
  headers: DEFAULT_HEADERS,
  body: JSON.stringify(payload),
});

const parseBody = (body) => {
  if (!body) {
    return {};
  }

  try {
    return JSON.parse(body);
  } catch (error) {
    const err = new Error("Invalid JSON payload");
    err.statusCode = 400;
    throw err;
  }
};

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const ensureJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw createHttpError(500, "JWT_SECRET is not configured");
  }

  return secret;
};

const sanitizeUser = (user) => {
  if (!user) return null;
  return {
    id: user._id ? user._id.toString() : undefined,
    username: user.username,
    email: user.email,
    role: user.role,
    // settings is a flexible object; only expose whitelisted keys if needed
    settings: user.settings || {},
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

const signToken = (user, options = {}) => {
  const secret = ensureJwtSecret();
  const payload = {
    sub: user._id ? user._id.toString() : undefined,
    email: user.email,
    username: user.username,
  };

  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    ...options,
  });
};

const verifyToken = (token) => {
  const secret = ensureJwtSecret();
  return jwt.verify(token, secret);
};

const hashPassword = async (password) => {
  if (!password || password.length < 8) {
    throw createHttpError(400, "Password must be at least 8 characters long");
  }

  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
  return bcrypt.hash(password, saltRounds);
};

const comparePassword = async (password, hash) => {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
};

const extractBearerToken = (event) => {
  const authHeader =
    event.headers?.authorization || event.headers?.Authorization;

  if (!authHeader) {
    return null;
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw createHttpError(401, "Invalid authorization header");
  }

  return token;
};

const handleError = (error, context = "auth") => {
  console.error(`[${context}]`, error);
  const statusCode = error.statusCode || 500;
  return respond(statusCode, {
    error: error.message || "Internal Server Error",
  });
};

// Role kontrol helper'ı
const requireRole = (user, roles) => {
  if (!user) throw createHttpError(401, "Unauthorized");
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!allowed.includes(user.role)) {
    throw createHttpError(403, "Forbidden: insufficient role");
  }
};

module.exports = {
  DEFAULT_HEADERS,
  respond,
  parseBody,
  createHttpError,
  sanitizeUser,
  signToken,
  verifyToken,
  hashPassword,
  comparePassword,
  extractBearerToken,
  handleError,
  requireRole,
};
