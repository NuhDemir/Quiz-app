const mongoose = require("mongoose");

const REVIEW_STATES = ["new", "learning", "review", "mastered"];

const ReviewEventSchema = new mongoose.Schema(
  {
    reviewedAt: { type: Date, default: Date.now },
    result: {
      type: String,
      enum: ["success", "failure", "skipped"],
      default: "success",
    },
    easeFactor: { type: Number },
    interval: { type: Number },
    durationMs: { type: Number },
    notes: { type: String },
  },
  { _id: false }
);

const VocabularyProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    word: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WordEntry",
      required: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VocabularyCategory",
    },
    deck: {
      type: String,
      enum: ["learn", "review", "custom"],
      default: "learn",
    },
    status: { type: String, enum: REVIEW_STATES, default: "new" },
    easeFactor: { type: Number, default: 2.5 },
    interval: { type: Number, default: 0 },
    repetition: { type: Number, default: 0 },
    lastReviewedAt: { type: Date },
    nextReviewAt: { type: Date },
    dueOverrideAt: { type: Date },
    reviewHistory: [ReviewEventSchema],
    notes: { type: String },
  },
  { timestamps: true }
);

VocabularyProgressSchema.index({ user: 1, word: 1 }, { unique: true });

module.exports =
  mongoose.models.VocabularyProgress ||
  mongoose.model("VocabularyProgress", VocabularyProgressSchema);
