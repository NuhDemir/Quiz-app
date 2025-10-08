const mongoose = require("mongoose");
const connectDB = require("./db");
const WordEntry = require("../../models/WordEntry");
const VocabularyProgress = require("../../models/VocabularyProgress");
const User = require("../../models/User");
const {
  extractBearerToken,
  verifyToken,
  respond,
  handleError,
  createHttpError,
  requireRole,
} = require("./auth-helpers");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return respond(204, {});
  if (event.httpMethod !== "DELETE")
    return respond(405, { error: "Method Not Allowed" });

  try {
    await connectDB();

    const token = extractBearerToken(event);
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.sub);
    requireRole(user, ["admin"]);

    const params = event.queryStringParameters || {};
    const idParam = params.id || params.wordId;

    if (!idParam || !mongoose.Types.ObjectId.isValid(idParam)) {
      throw createHttpError(400, "Valid vocabulary id is required");
    }

    const id = new mongoose.Types.ObjectId(idParam);
    const entry = await WordEntry.findById(id);

    if (!entry) {
      throw createHttpError(404, "Vocabulary item not found");
    }

    await VocabularyProgress.deleteMany({ word: id });
    await entry.deleteOne();

    return respond(200, { success: true });
  } catch (error) {
    return handleError(error, "vocabulary-delete");
  }
};
