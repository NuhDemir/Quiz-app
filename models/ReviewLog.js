const mongoose = require("mongoose");

const ReviewLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: { type: String, enum: ["word", "grammar"], required: true },
    refId: { type: mongoose.Schema.Types.ObjectId, required: true }, // WordEntry veya GrammarTopic id
    action: {
      type: String,
      enum: ["review", "promote", "demote", "master"],
      required: true,
    },
    beforeStatus: { type: String },
    afterStatus: { type: String },
    intervalDays: { type: Number },
    easeFactor: { type: Number },
    correct: { type: Boolean },
    timeSpentSec: { type: Number, default: 0 },
    reviewedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ReviewLogSchema.index({ user: 1, reviewedAt: -1 });
ReviewLogSchema.index({ type: 1, reviewedAt: -1 });

module.exports =
  mongoose.models.ReviewLog || mongoose.model("ReviewLog", ReviewLogSchema);
