const connectDB = require("./db");
const User = require("../../models/User");
const {
  respond,
  parseBody,
  createHttpError,
  sanitizeUser,
  signToken,
  comparePassword,
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
    const rawIdentifier = body.identifier ?? body.email ?? body.username ?? "";
    const identifier = rawIdentifier.trim();
    const password = body.password;

    if (!identifier || !password) {
      throw createHttpError(400, "Email or username and password are required");
    }

    const isEmail = /@/.test(identifier);
    const query = isEmail
      ? { email: identifier.toLowerCase() }
      : { username: identifier };

    const user = await User.findOne(query);

    if (!user) {
      throw createHttpError(401, "Invalid credentials");
    }

    // Email doğrulama gereksinimi kaldırıldı

    const passwordValid = await comparePassword(password, user.passwordHash);

    if (!passwordValid) {
      throw createHttpError(401, "Invalid credentials");
    }

    const token = signToken(
      user,
      body.rememberMe ? { expiresIn: "30d" } : undefined
    );

    return respond(200, {
      message: "Login successful",
      user: sanitizeUser(user),
      token,
    });
  } catch (error) {
    return handleError(error, "auth-login");
  }
};
