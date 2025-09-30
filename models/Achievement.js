const mongoose = require("mongoose");

const AchievementSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String },
    tier: {
      type: String,
      enum: ["bronze", "silver", "gold", "platinum", "diamond"],
      default: "bronze",
    },
    criteria: { type: Object, default: {} },
    pointsReward: { type: Number, default: 0 },
    charmsReward: { type: Number, default: 0 },
    repeatable: { type: Boolean, default: false },
    maxRepeats: { type: Number, default: 1 },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Achievement || mongoose.model("Achievement", AchievementSchema);