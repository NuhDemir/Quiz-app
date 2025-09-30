const mongoose = require("mongoose");

const DailyUserStatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD
    quizzesCompleted: { type: Number, default: 0 },
    wordsReviewed: { type: Number, default: 0 },
    wordsMastered: { type: Number, default: 0 },
    grammarReviewed: { type: Number, default: 0 },
    xpEarned: { type: Number, default: 0 },
    pointsEarned: { type: Number, default: 0 },
    streakActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

DailyUserStatSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports =
  mongoose.models.DailyUserStat ||
  mongoose.model("DailyUserStat", DailyUserStatSchema);
