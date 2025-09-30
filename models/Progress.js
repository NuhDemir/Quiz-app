const mongoose = require("mongoose");

const SessionSchema = new mongoose.Schema(
  {
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" },
    category: { type: String, trim: true },
    score: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },
    streakDelta: { type: Number, default: 0 },
    takenAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    totalQuizzes: {
      type: Number,
      default: 0,
    },
    accuracy: {
      type: Number,
      default: 0,
    },
    streak: {
      type: Number,
      default: 0,
    },
    xp: {
      type: Number,
      default: 0,
    },
    badges: {
      type: [String],
      default: [],
    },
    recentSessions: {
      type: [SessionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Progress || mongoose.model("Progress", ProgressSchema);
