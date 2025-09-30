const connectDB = require("./db");
const User = require("../../models/User");
const WordEntry = require("../../models/WordEntry");
const {
  extractBearerToken,
  verifyToken,
  respond,
  parseBody,
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

    const body = parseBody(event.body);
    const { term, definition, example, language = "en", tags = [] } = body;
    if (!term || !definition)
      throw createHttpError(400, "term and definition required");

    let entry = await WordEntry.findOne({ term, language });
    if (!entry) {
      entry = await WordEntry.create({
        term,
        definition,
        example,
        language,
        tags,
      });
    }

    // attach to user if not already
    const exists = user.wordProgress.find(
      (p) => p.wordEntry.toString() === entry._id.toString()
    );
    if (!exists) {
      user.wordProgress.push({ wordEntry: entry._id, status: "new" });
      user.studyStats.wordsAdded = (user.studyStats.wordsAdded || 0) + 1;
      await user.save();
    }

    return respond(200, {
      success: true,
      wordEntryId: entry._id.toString(),
      alreadyHad: Boolean(exists),
    });
  } catch (error) {
    return handleError(error, "word-add");
  }
};
