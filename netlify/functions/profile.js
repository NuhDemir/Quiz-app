const connectDB = require("./db");
const User = require("../../models/User");
const QuizAttempt = require("../../models/QuizAttempt");
const {
  respond,
  handleError,
  extractBearerToken,
  verifyToken,
  sanitizeUser,
  createHttpError,
} = require("./auth-helpers");

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

  // Insights (reuse previous logic with new fields)
  const xp = progress.xp;
  const streak = progress.streak;
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
