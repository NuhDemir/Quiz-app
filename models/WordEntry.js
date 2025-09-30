const mongoose = require("mongoose");

const WordEntrySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
    word: { type: String, required: true, trim: true },
    definition: { type: String },
    translation: { type: String },
    examples: [{ type: String }],
    level: {
      type: String,
      enum: ["A1", "A2", "B1", "B2", "C1", "C2", "unknown"],
      default: "unknown",
    },
    tags: [{ type: String }],
    status: {
      type: String,
      enum: ["new", "learning", "review", "mastered"],
      default: "new",
      index: true,
    },
    timesReviewed: { type: Number, default: 0 },
    lastReviewedAt: { type: Date },
    nextReviewAt: { type: Date },
    spacedRepetitionData: {
      interval: { type: Number, default: 0 }, // days
      easeFactor: { type: Number, default: 2.5 },
      repetition: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

WordEntrySchema.index({ user: 1, word: 1 }, { unique: true });

module.exports =
  mongoose.models.WordEntry || mongoose.model("WordEntry", WordEntrySchema);