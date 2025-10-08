const mongoose = require("mongoose");
const connectDB = require("./db");
const WordEntry = require("../../models/WordEntry");
const { respond, handleError } = require("./auth-helpers");

const resolveWordId = (value) => {
  if (!value) return null;
  if (mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(value);
  }
  return null;
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return respond(204, {});
  if (event.httpMethod !== "GET")
    return respond(405, { error: "Method Not Allowed" });

  try {
    await connectDB();
    const params = event.queryStringParameters || {};
    const id = resolveWordId(params.id);
    const term = params.term?.trim();

    if (!id && !term) {
      return respond(400, { error: "A vocabulary id or term is required" });
    }

    const filter = { owner: { $exists: false } };
    if (id) {
      filter._id = id;
    }
    if (term) {
      filter.normalizedTerm = term.toLowerCase();
    }

    const entry = await WordEntry.findOne(filter)
      .populate({ path: "category", select: "name slug color" })
      .lean();

    if (!entry) {
      return respond(404, { error: "Vocabulary item not found" });
    }

    return respond(200, { item: entry });
  } catch (error) {
    return handleError(error, "vocabulary-detail");
  }
};
