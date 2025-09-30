const mongoose = require("mongoose");

const QuizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, trim: true },
    category: { type: String, index: true }, // örn: vocabulary / grammar / mixed
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
    timeLimitSec: { type: Number },
    questionCount: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false, index: true },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
        required: true,
      },
    ],
    meta: {
      plays: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      averageAccuracy: { type: Number, default: 0 },
      lastPlayedAt: { type: Date },
    },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Top popüler quizler için
QuizSchema.index({ "meta.plays": -1 });
// Filtreleme için bileşik index
QuizSchema.index({ category: 1, level: 1, difficulty: 1, isPublished: 1 });

QuizSchema.pre("save", function (next) {
  if (this.isModified("questions")) {
    this.questionCount = this.questions.length;
  }
  next();
});

module.exports = mongoose.models.Quiz || mongoose.model("Quiz", QuizSchema);
