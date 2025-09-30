const connectDB = require("./db");
const User = require("../../models/User");
const {
  respond,
  createHttpError,
  sanitizeUser,
  verifyToken,
  extractBearerToken,
  handleError,
} = require("./auth-helpers");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return respond(204, {});
  }

  if (event.httpMethod !== "GET") {
    return respond(405, { error: "Method Not Allowed" });
  }

  try {
    try {
      await connectDB();
    } catch (dbErr) {
      // Bağlantı hatası kullanıcıya daha temiz mesajla dönsün
      return respond(500, {
        error: "Veritabanı bağlantı hatası",
        detail: dbErr.message,
        hint: "IP whitelist ayarlarınızı ve MONGODB_URI değerini doğrulayın. Geliştirme ortamında Atlas'ta Network Access > IP Access List kısmına mevcut IP'nizi ekleyin.",
      });
    }

    const token = extractBearerToken(event);

    if (!token) {
      throw createHttpError(401, "Authorization header missing");
    }

    let payload;

    try {
      payload = verifyToken(token);
    } catch (error) {
      throw createHttpError(401, "Invalid or expired token");
    }

    const userId = payload.sub || payload.id || payload._id;

    if (!userId) {
      throw createHttpError(400, "Token payload is invalid");
    }

    const user = await User.findById(userId);

    if (!user) {
      throw createHttpError(404, "User not found");
    }

    return respond(200, {
      user: sanitizeUser(user),
    });
  } catch (error) {
    return handleError(error, "auth-me");
  }
};
