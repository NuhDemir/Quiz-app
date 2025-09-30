const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    explanation: { type: String },
    options: {
      type: [String],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length >= 2,
        message: "A question must contain at least two options.",
      },
      required: true,
    },
    correctAnswer: { type: String, required: true },
    category: { type: String, index: true },
    level: {
      type: String,
      enum: ["A1", "A2", "B1", "B2", "C1", "C2", "mixed"],
      default: "mixed",
      index: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
      index: true,
    },
    tags: [{ type: String, index: true }],
    source: { type: String },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    stats: {
      timesUsed: { type: Number, default: 0 },
      correctCount: { type: Number, default: 0 },
      wrongCount: { type: Number, default: 0 },
      lastUsedAt: { type: Date },
    },
  },
  { timestamps: true }
);

QuestionSchema.index({ "stats.timesUsed": -1 });
QuestionSchema.index({ category: 1, difficulty: 1, level: 1 });

module.exports =
  mongoose.models.Question || mongoose.model("Question", QuestionSchema);
