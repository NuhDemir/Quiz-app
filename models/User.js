const mongoose = require("mongoose");

// Alt şemalar
const WordProgressSchema = new mongoose.Schema(
  {
    wordEntry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WordEntry",
      required: true,
    },
    status: {
      type: String,
      enum: ["new", "learning", "review", "mastered"],
      default: "new",
    },
    timesReviewed: { type: Number, default: 0 },
    lastReviewedAt: { type: Date },
    nextReviewAt: { type: Date },
  },
  { _id: false }
);

const GrammarTopicProgressSchema = new mongoose.Schema(
  {
    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GrammarTopic",
      required: true,
    },
    completedSections: [{ type: String }],
    attempts: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    lastReviewedAt: { type: Date },
    progressPercent: { type: Number, default: 0 },
  },
  { _id: false }
);

const CategoryStatSchema = new mongoose.Schema(
  {
    attempts: { type: Number, default: 0 },
    correct: { type: Number, default: 0 },
  },
  { _id: false }
);

const LevelStatSchema = new mongoose.Schema(
  {
    attempts: { type: Number, default: 0 },
    correct: { type: Number, default: 0 },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true, unique: true },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    passwordHash: { type: String, required: true },

    // Rol tabanlı yetkilendirme
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },

    settings: { type: Object, default: {} },

    // Ekonomi
    points: { type: Number, default: 0, index: true },
    charms: { type: Number, default: 0 },

    // Ödül / rozet
    badges: [{ type: mongoose.Schema.Types.ObjectId, ref: "Badge" }],
    achievements: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Achievement" },
    ],

    // Quiz istatistikleri
    quizStats: {
      totalQuizzes: { type: Number, default: 0 },
      totalQuestions: { type: Number, default: 0 },
      totalCorrect: { type: Number, default: 0 },
      totalWrong: { type: Number, default: 0 },
      currentStreak: { type: Number, default: 0 },
      longestStreak: { type: Number, default: 0 },
      category: {
        type: Map,
        of: CategoryStatSchema,
        default: {},
      },
      level: {
        type: Map,
        of: LevelStatSchema,
        default: {},
      },
    },

    // Çalışma ilerlemeleri
    wordProgress: [WordProgressSchema],
    grammarProgress: [GrammarTopicProgressSchema],

    // Özet çalışma istatistikleri
    studyStats: {
      wordsAdded: { type: Number, default: 0 },
      wordsMastered: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 },
      grammarTopicsStarted: { type: Number, default: 0 },
      grammarTopicsCompleted: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Leaderboard index
UserSchema.index({ points: -1, updatedAt: -1 });
// Aktif kullanıcı sorguları için son güncellenenler
UserSchema.index({ updatedAt: -1 });
// Badge kazanımı + puan leaderboard alt kırılımı
UserSchema.index({ points: -1, charms: -1 });
// Quiz istatistikleri streak odaklı leaderboard (ör: en uzun streak)
UserSchema.index({ "quizStats.longestStreak": -1 });
// Yoğun kullanılan field kombinasyonu (kullanıcı adı + puan aralığı)
UserSchema.index({ username: 1, points: -1 });
// Sık arama yapılabilecek email + createdAt (admin raporları)
UserSchema.index({ email: 1, createdAt: -1 });

// Sanal accuracy
UserSchema.virtual("accuracy").get(function () {
  const total =
    (this.quizStats?.totalCorrect || 0) + (this.quizStats?.totalWrong || 0);
  if (!total) return 0;
  return Number(((this.quizStats.totalCorrect / total) * 100).toFixed(2));
});

// Güvenli dönüş helper (opsiyonel)
UserSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    username: this.username,
    points: this.points,
    charms: this.charms,
    accuracy: this.accuracy,
    quizStats: this.quizStats,
    studyStats: this.studyStats,
  };
};

module.exports = mongoose.models.User || mongoose.model("User", UserSchema);
