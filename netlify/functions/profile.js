const connectDB = require("./db");
const User = require("../../models/User");
const QuizAttempt = require("../../models/QuizAttempt");
require("../../models/Quiz");
const {
  respond,
  handleError,
  extractBearerToken,
  verifyToken,
  sanitizeUser,
  createHttpError,
} = require("./auth-helpers");

const toIsoString = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const formatVocabularyStats = (stats = {}) => {
  if (!stats || typeof stats !== "object") {
    return {
      xp: 0,
      streak: 0,
      longestStreak: 0,
      combo: 0,
      maxCombo: 0,
      totalReviews: 0,
      successCount: 0,
      failureCount: 0,
      skipCount: 0,
      daily: null,
      session: null,
      unlockedDecks: [],
      cooldownUntil: null,
      lastAward: null,
    };
  }

  const toNumber = (value, fallback = 0) =>
    Number.isFinite(value) ? value : fallback;

  const daily = stats.daily
    ? {
        date: stats.daily.date || null,
        reviews: toNumber(stats.daily.reviews),
        successes: toNumber(stats.daily.successes),
        xp: toNumber(stats.daily.xp),
        goal:
          stats.daily.goal !== undefined && stats.daily.goal !== null
            ? Number(stats.daily.goal)
            : null,
      }
    : null;

  const session = stats.session
    ? {
        startedAt: toIsoString(stats.session.startedAt),
        lastActivityAt: toIsoString(stats.session.lastActivityAt),
        xp: toNumber(stats.session.xp),
        combo: toNumber(stats.session.combo),
        maxCombo: toNumber(stats.session.maxCombo),
        achievements: Array.isArray(stats.session.achievements)
          ? stats.session.achievements
          : [],
      }
    : null;

  const lastAward = stats.lastAward
    ? {
        type: stats.lastAward.type || null,
        label: stats.lastAward.label || null,
        xp:
          stats.lastAward.xp !== undefined && stats.lastAward.xp !== null
            ? Number(stats.lastAward.xp)
            : null,
        awardedAt: toIsoString(stats.lastAward.awardedAt),
      }
    : null;

  return {
    xp: toNumber(stats.xp),
    streak: toNumber(stats.streak),
    longestStreak: toNumber(stats.longestStreak),
    combo: toNumber(stats.combo),
    maxCombo: toNumber(stats.maxCombo),
    totalReviews: toNumber(stats.totalReviews),
    successCount: toNumber(stats.successCount),
    failureCount: toNumber(stats.failureCount),
    skipCount: toNumber(stats.skipCount),
    daily,
    session,
    unlockedDecks: Array.isArray(stats.unlockedDecks)
      ? stats.unlockedDecks
      : [],
    cooldownUntil: toIsoString(stats.cooldownUntil),
    lastAward,
  };
};

async function buildProgressAndInsights(user) {
  // Build progress dto from user + last attempts (similar shape to legacy)
  const qs = user.quizStats || {};
  const totalCorrect = qs.totalCorrect || 0;
  const totalWrong = qs.totalWrong || 0;
  const accuracyBase = totalCorrect + totalWrong;
  const accuracy = accuracyBase
    ? Math.round((totalCorrect / accuracyBase) * 100)
    : 0;

  const attempts = await QuizAttempt.find({ user: user._id })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate({ path: "quiz", select: "category" })
    .lean();

  const recentSessions = attempts.map((a) => ({
    quizId: a.quiz?._id?.toString?.() || a.quiz?.toString?.() || null,
    category: a.quiz?.category || "general",
    score: a.score || 0,
    accuracy: a.accuracy || 0,
    duration: a.durationSec || 0,
    streakDelta: a.meta?.streakDelta || 0,
    takenAt: (a.finishedAt || a.createdAt || new Date()).toISOString(),
  }));

  const progress = {
    userId: user._id.toString(),
    totalQuizzes: qs.totalQuizzes || 0,
    accuracy,
    streak: qs.currentStreak || 0,
    xp: user.points || 0,
    badges: (user.badges || []).map((b) => b.toString()),
    recentSessions,
    updatedAt: user.updatedAt?.toISOString?.() || null,
    createdAt: user.createdAt?.toISOString?.() || null,
  };

  const vocabularyStats = formatVocabularyStats(user.vocabularyStats || {});
  progress.vocabulary = vocabularyStats;

  const quizXp = progress.xp || 0;
  const vocabularyXp = vocabularyStats.xp || 0;

  // Insights (reuse previous logic with new fields)
  const xp = quizXp > 0 ? quizXp : vocabularyXp;
  const streak =
    progress.streak || vocabularyStats.streak || qs.currentStreak || 0;
  const levelStep = 500;
  const level = Math.max(1, Math.floor(xp / levelStep) + 1);
  const levelFloor = (level - 1) * levelStep;
  const nextLevelXp = level * levelStep;
  const xpIntoLevel = xp - levelFloor;
  const xpProgress =
    nextLevelXp === levelFloor
      ? 100
      : Math.round((xpIntoLevel / (nextLevelXp - levelFloor)) * 100);
  const streakTier =
    streak >= 20
      ? "Elmas Seri"
      : streak >= 10
      ? "Altın Seri"
      : streak >= 5
      ? "Gümüş Seri"
      : "Yeni Başlangıç";
  const lastSession = recentSessions[0] || null;
  const lastActiveAt =
    lastSession?.takenAt || progress.updatedAt || progress.createdAt || null;
  let recentAccuracy = null;
  if (recentSessions.length) {
    const totalA = recentSessions.reduce((s, r) => s + (r.accuracy || 0), 0);
    recentAccuracy = Number((totalA / recentSessions.length).toFixed(1));
  }
  const insights = {
    xpLevel: level,
    xpProgress: Math.min(Math.max(xpProgress, 0), 100),
    xpToNext: Math.max(nextLevelXp - xp, 0),
    nextLevelXp,
    levelFloorXp: levelFloor,
    streakTier,
    lastActiveAt,
    recentAccuracy,
    badgesEarned: progress.badges.length,
    vocabulary: {
      xp: vocabularyXp,
      streak: vocabularyStats.streak || 0,
      longestStreak:
        vocabularyStats.longestStreak || vocabularyStats.streak || 0,
      daily: vocabularyStats.daily,
      session: vocabularyStats.session,
    },
    quiz: {
      xp: quizXp,
      streak: progress.streak || 0,
      totalQuizzes: progress.totalQuizzes,
      accuracy: progress.accuracy,
    },
  };

  return { progress, insights };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return respond(204, {});
  }

  if (event.httpMethod !== "GET") {
    return respond(405, { error: "Method Not Allowed" });
  }

  try {
    try {
      await connectDB();
    } catch (dbErr) {
      return respond(500, {
        error: "Veritabanı bağlantı hatası",
        detail: dbErr.message,
        hint: "MongoDB Atlas IP whitelist / MONGODB_URI kontrol edin. Lokal geliştirmede ağ bağlantısı ve firewall ayarlarını doğrulayın.",
      });
    }

    const token = extractBearerToken(event);

    if (!token) {
      throw createHttpError(401, "Authorization header missing");
    }

    let payload;

    try {
      payload = verifyToken(token);
    } catch (error) {
      throw createHttpError(401, "Invalid or expired token");
    }

    const userId = payload.sub || payload.id || payload._id;

    if (!userId) {
      throw createHttpError(400, "Token payload is invalid");
    }

    const user = await User.findById(userId);

    if (!user) {
      throw createHttpError(404, "User not found");
    }

    const userIdString = user._id.toString();

    const { progress, insights } = await buildProgressAndInsights(user);

    return respond(200, {
      profile: {
        user: sanitizeUser(user),
        progress,
        insights,
      },
    });
  } catch (error) {
    return handleError(error, "profile");
  }
};
