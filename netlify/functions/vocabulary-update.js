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
  if (event.httpMethod !== "PUT")
    return respond(405, { error: "Method Not Allowed" });

  try {
    await connectDB();

    const token = extractBearerToken(event);
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.sub);
    requireRole(user, ["admin"]);

    const body = parseBody(event.body);
    const { id } = body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw createHttpError(400, "Valid vocabulary id is required");
    }

    const payload = { lastEditor: user._id };

    const updatableFields = [
      "term",
      "translation",
      "definition",
      "language",
      "examples",
      "notes",
      "tags",
      "level",
      "difficulty",
      "status",
      "decks",
      "spacedRepetition",
    ];

    updatableFields.forEach((field) => {
      if (body[field] !== undefined) {
        payload[field] = body[field];
      }
    });

    if (payload.examples && !Array.isArray(payload.examples)) {
      payload.examples = [payload.examples].flat();
    }

    if (body.category !== undefined) {
      if (!body.category) {
        payload.category = undefined;
      } else {
        const resolvedCategory = await resolveCategory(body.category);
        if (!resolvedCategory) {
          throw createHttpError(400, "Category could not be resolved");
        }
        payload.category = resolvedCategory._id;
      }
    }

    if (body.subcategories !== undefined) {
      const resolved = [];
      for (const sub of body.subcategories || []) {
        const categoryDoc = await resolveCategory(sub);
        if (categoryDoc) resolved.push(categoryDoc._id);
      }
      payload.subcategories = resolved;
    }

    if (body.decks !== undefined) {
      const defaultDecks = {
        learn: { isEnabled: true, initialIntervalDays: 0, batchLimit: 20 },
        review: { isEnabled: true, intervalModifier: 1, maxIntervalDays: 30 },
      };
      const requestedDecks = body.decks || {};
      payload.decks = {
        learn: { ...defaultDecks.learn, ...(requestedDecks.learn || {}) },
        review: {
          ...defaultDecks.review,
          ...(requestedDecks.review || {}),
        },
      };
    }

    if (body.spacedRepetition !== undefined) {
      const requested = body.spacedRepetition || {};
      payload.spacedRepetition = {
        easeFactor: requested.easeFactor ?? 2.5,
        interval: requested.interval ?? 0,
        repetition: requested.repetition ?? 0,
      };
    }

    const updated = await WordEntry.findOneAndUpdate(
      { _id: id },
      { $set: payload },
      { new: true, runValidators: true }
    ).populate({ path: "category", select: "name slug" });

    if (!updated) {
      throw createHttpError(404, "Vocabulary item not found");
    }

    return respond(200, { item: updated.toObject() });
  } catch (error) {
    return handleError(error, "vocabulary-update");
  }
};
