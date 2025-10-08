const mongoose = require("mongoose");

const sessionResultSchema = new mongoose.Schema(
  {
    correct: { type: Number, default: 0 },
    incorrect: { type: Number, default: 0 },
    skipped: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    durationMs: { type: Number, default: 0 },
    combo: { type: Number, default: 0 },
    maxCombo: { type: Number, default: 0 },
    xpEarned: { type: Number, default: 0 },
  },
  { _id: false }
);

const sessionStateSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["active", "completed", "expired"],
      default: "active",
    },
    livesRemaining: { type: Number, default: 3 },
    timeRemainingMs: { type: Number, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const VocabularyGameSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    type: {
      type: String,
      required: true,
      enum: ["word-hunt", "speed-challenge", "flashcard-battle"],
      index: true,
    },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    expiresAt: { type: Date },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    state: { type: sessionStateSchema, default: () => ({}) },
    result: { type: sessionResultSchema, default: () => ({}) },
    events: [
      {
        at: { type: Date, default: Date.now },
        type: { type: String, required: true },
        data: { type: mongoose.Schema.Types.Mixed, default: {} },
      },
    ],
  },
  { timestamps: true }
);

VocabularyGameSessionSchema.index({ user: 1, type: 1, startedAt: -1 });
VocabularyGameSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports =
  mongoose.models.VocabularyGameSession ||
  mongoose.model("VocabularyGameSession", VocabularyGameSessionSchema);
