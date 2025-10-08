const mongoose = require("mongoose");
const connectDB = require("./db");
const WordEntry = require("../../models/WordEntry");
const VocabularyCategory = require("../../models/VocabularyCategory");
const User = require("../../models/User");
const {
  extractBearerToken,
  verifyToken,
  parseBody,
  respond,
  createHttpError,
  handleError,
  requireRole,
} = require("./auth-helpers");

const resolveCategory = async (category) => {
  if (!category) return null;
  if (mongoose.Types.ObjectId.isValid(category)) {
    return VocabularyCategory.findById(category);
  }
  return VocabularyCategory.findOne({ slug: category });
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return respond(204, {});
  if (event.httpMethod !== "POST")
    return respond(405, { error: "Method Not Allowed" });

  try {
    await connectDB();

    const token = extractBearerToken(event);
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.sub);
    requireRole(user, ["admin"]);

    const body = parseBody(event.body);
    const {
      term,
      translation,
      definition,
      language = "en",
      examples = [],
      notes,
      category,
      subcategories = [],
      tags = [],
      level = "unknown",
      difficulty = "easy",
      status = "draft",
      decks = {},
      spacedRepetition = {},
    } = body;

    if (!term) {
      throw createHttpError(400, "Term is required");
    }

    let resolvedCategory = null;
    if (category) {
      resolvedCategory = await resolveCategory(category);
      if (!resolvedCategory) {
        throw createHttpError(400, "Category could not be resolved");
      }
    }

    const resolvedSubcategories = [];
    for (const sub of subcategories) {
      const resolved = await resolveCategory(sub);
      if (resolved) {
        resolvedSubcategories.push(resolved._id);
      }
    }

    const defaultDecks = {
      learn: { isEnabled: true, initialIntervalDays: 0, batchLimit: 20 },
      review: { isEnabled: true, intervalModifier: 1, maxIntervalDays: 30 },
    };

    const entry = await WordEntry.create({
      term,
      translation,
      definition,
      language,
      examples,
      notes,
      category: resolvedCategory?._id,
      subcategories: resolvedSubcategories,
      tags,
      level,
      difficulty,
      status,
      decks: {
        learn: { ...defaultDecks.learn, ...(decks.learn || {}) },
        review: { ...defaultDecks.review, ...(decks.review || {}) },
      },
      spacedRepetition: {
        easeFactor: spacedRepetition.easeFactor ?? 2.5,
        interval: spacedRepetition.interval ?? 0,
        repetition: spacedRepetition.repetition ?? 0,
      },
      author: user._id,
      lastEditor: user._id,
    });

    return respond(201, { item: entry.toObject() });
  } catch (error) {
    return handleError(error, "vocabulary-create");
  }
};
