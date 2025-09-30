const mongoose = require("mongoose");

const BadgeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String },
    icon: { type: String },
    criteria: { type: Object, default: {} },
    pointsReward: { type: Number, default: 0 },
    charmsReward: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Badge || mongoose.model("Badge", BadgeSchema);