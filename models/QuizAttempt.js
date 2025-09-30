const mongoose = require("mongoose");

const QuizAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true,
    },
    questionCount: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    wrongCount: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    durationSec: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    finishedAt: { type: Date },
    answers: [
      {
        question: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Question",
          required: true,
        },
        selected: { type: String },
        isCorrect: { type: Boolean },
        timeSpentSec: { type: Number, default: 0 },
      },
    ],
    meta: {
      streakDelta: { type: Number, default: 0 },
      xpEarned: { type: Number, default: 0 },
      pointsEarned: { type: Number, default: 0 },
      charmsEarned: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

QuizAttemptSchema.index({ user: 1, createdAt: -1 });
QuizAttemptSchema.index({ quiz: 1, createdAt: -1 });
QuizAttemptSchema.index({ accuracy: -1 });

module.exports =
  mongoose.models.QuizAttempt ||
  mongoose.model("QuizAttempt", QuizAttemptSchema);
