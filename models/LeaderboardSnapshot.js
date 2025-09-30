const mongoose = require("mongoose");

const LeaderboardSnapshotSchema = new mongoose.Schema(
  {
    period: { type: String, required: true, index: true }, // YYYY-MM veya ISO week
    type: { type: String, enum: ["monthly", "weekly", "alltime"], default: "monthly" },
    generatedAt: { type: Date, default: Date.now },
    entries: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        username: { type: String },
        points: { type: Number, default: 0 },
        rank: { type: Number },
      },
    ],
  },
  { timestamps: true }
);

LeaderboardSnapshotSchema.index({ type: 1, period: 1 }, { unique: true });

module.exports =
  mongoose.models.LeaderboardSnapshot ||
  mongoose.model("LeaderboardSnapshot", LeaderboardSnapshotSchema);