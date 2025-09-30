const connectDB = require("./db");
const User = require("../../models/User");
const {
  respond,
  parseBody,
  createHttpError,
  sanitizeUser,
  signToken,
  hashPassword,
  handleError,
} = require("./auth-helpers");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return respond(204, {});
  }

  if (event.httpMethod !== "POST") {
    return respond(405, { error: "Method Not Allowed" });
  }

  try {
    await connectDB();

    const body = parseBody(event.body);
    const username = body.username?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!username || username.length < 3) {
      throw createHttpError(400, "Username must be at least 3 characters long");
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw createHttpError(400, "A valid email is required");
    }

    if (!password || password.length < 8) {
      throw createHttpError(400, "Password must be at least 8 characters long");
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      const field = existingUser.email === email ? "Email" : "Username";
      throw createHttpError(409, `${field} is already in use`);
    }

    const passwordHash = await hashPassword(password);

    const userCount = await User.countDocuments();
    const role = userCount === 0 ? "admin" : "user";

    const user = await User.create({
      username,
      email,
      passwordHash,
      role,
    });

    const token = signToken(user);
    return respond(201, {
      message: "Registration successful.",
      user: sanitizeUser(user),
      token,
    });
  } catch (error) {
    return handleError(error, "auth-register");
  }
};
