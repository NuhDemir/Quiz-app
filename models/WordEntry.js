const mongoose = require("mongoose");

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2", "unknown"];
const WORD_STATUS = ["draft", "published", "archived"];
const REVIEW_STATES = ["new", "learning", "review", "mastered"];

const WordEntrySchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    term: { type: String, required: true, trim: true },
    normalizedTerm: { type: String, trim: true, lowercase: true, index: true },
    translation: { type: String, trim: true },
    definition: { type: String },
    language: { type: String, default: "en", trim: true },
    examples: [{ type: String }],
    notes: { type: String },
    level: {
      type: String,
      enum: LEVELS,
      default: "unknown",
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VocabularyCategory",
      index: true,
    },
    subcategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "VocabularyCategory",
      },
    ],
    tags: [{ type: String }],
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy",
      index: true,
    },
    status: {
      type: String,
      enum: WORD_STATUS,
      default: "draft",
      index: true,
    },
    decks: {
      learn: {
        isEnabled: { type: Boolean, default: true },
        initialIntervalDays: { type: Number, default: 0 },
        batchLimit: { type: Number, default: 20 },
      },
      review: {
        isEnabled: { type: Boolean, default: true },
        intervalModifier: { type: Number, default: 1 },
        maxIntervalDays: { type: Number, default: 30 },
      },
    },
    spacedRepetition: {
      easeFactor: { type: Number, default: 2.5 },
      interval: { type: Number, default: 0 },
      repetition: { type: Number, default: 0 },
    },
    reviewState: {
      type: String,
      enum: REVIEW_STATES,
      default: "new",
    },
    lastReviewedAt: { type: Date },
    nextReviewAt: { type: Date },
    stats: {
      totalReviews: { type: Number, default: 0 },
      successCount: { type: Number, default: 0 },
      failCount: { type: Number, default: 0 },
    },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    lastEditor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

WordEntrySchema.index(
  { owner: 1, normalizedTerm: 1, language: 1 },
  {
    unique: true,
    partialFilterExpression: {
      owner: { $type: "objectId" },
    },
  }
);

WordEntrySchema.index(
  { normalizedTerm: 1, language: 1 },
  {
    unique: true,
    partialFilterExpression: {
      owner: { $exists: false },
    },
  }
);

WordEntrySchema.pre("validate", function normalizeTerm(next) {
  if (this.term) {
    this.normalizedTerm = this.term
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }
  next();
});

module.exports =
  mongoose.models.WordEntry || mongoose.model("WordEntry", WordEntrySchema);
