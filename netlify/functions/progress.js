// Refactored progress endpoint: now derives data from User + QuizAttempt models (legacy Progress removed)
const connectDB = require("./db");
const User = require("../../models/User");
const QuizAttempt = require("../../models/QuizAttempt");
// Ensure population targets registered
require("../../models/Badge");
require("../../models/Achievement");

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const respond = (statusCode, payload) => ({
  statusCode,
  headers: DEFAULT_HEADERS,
  body: JSON.stringify(payload),
});

// Aggregates user's quiz progress using new schema.
// Returned shape kept backward-compatible with old Progress-based frontend component expectations.
async function buildProgressDTO(userId) {
  const user = await User.findById(userId)
    .populate("badges achievements", "code name title")
    .lean();

  if (!user) {
    return {
      userId,
      totalQuizzes: 0,
      accuracy: 0,
      streak: 0,
      xp: 0,
      badges: [],
      recentSessions: [],
      updatedAt: null,
      createdAt: null,
    };
  }

  const qs = user.quizStats || {};
  const totalQuizzes = qs.totalQuizzes || 0;
  const totalCorrect = qs.totalCorrect || 0;
  const totalWrong = qs.totalWrong || 0;
  const accuracyBase = totalCorrect + totalWrong;
  const accuracy = accuracyBase
    ? Math.round((totalCorrect / accuracyBase) * 100)
    : 0;

  // recent sessions: last 10 QuizAttempt docs
  const attempts = await QuizAttempt.find({ user: user._id })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate({ path: "quiz", select: "category" })
    .lean();

  const recentSessions = attempts.map((a) => ({
    quizId:
      a.quiz?.toString?.() || (a.quiz?._id ? a.quiz._id.toString() : null),
    category: a.quiz?.category || "general",
    score: a.score || 0,
    accuracy: a.accuracy || 0,
    duration: a.durationSec || 0,
    streakDelta: a.meta?.streakDelta || 0,
    takenAt: (a.finishedAt || a.createdAt || new Date()).toISOString(),
  }));

  return {
    userId: user._id.toString(),
    totalQuizzes,
    accuracy, // percentage 0-100
    streak: qs.currentStreak || 0,
    xp: user.points || 0, // map points -> xp for backward compatibility
    badges: Array.isArray(user.badges)
      ? user.badges.map((b) =>
          typeof b === "object" ? b._id?.toString?.() || b.code || b.name : b
        )
      : [],
    recentSessions,
    updatedAt: user.updatedAt,
    createdAt: user.createdAt,
  };
}

const parseBody = (body) => {
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch (error) {
    throw new Error("Invalid JSON payload");
  }
};

const normalizeMetrics = (metrics = {}) => {
  const allowed = ["totalQuizzes", "accuracy", "streak", "xp"];
  return allowed.reduce((acc, key) => {
    if (metrics[key] !== undefined) {
      acc[key] = metrics[key];
    }
    return acc;
  }, {});
};

const normalizeSession = (session = {}, metrics = {}) => ({
  quizId: session.quizId || null,
  category: session.category || "general",
  score: session.score ?? 0,
  accuracy: session.accuracy ?? metrics.accuracy ?? 0,
  duration: session.duration ?? 0,
  streakDelta: session.streakDelta ?? 0,
  takenAt: session.takenAt ? new Date(session.takenAt) : new Date(),
});

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return respond(204, {});
  }

  if (!["GET", "POST"].includes(event.httpMethod)) {
    return respond(405, { error: "Method Not Allowed" });
  }

  try {
    await connectDB();

    if (event.httpMethod === "GET") {
      const userId = event.queryStringParameters?.userId?.trim();
      if (!userId) {
        return respond(400, { error: "userId query param is required" });
      }
      const dto = await buildProgressDTO(userId);
      return respond(200, { progress: dto });
    }

    // POST previously mutated legacy Progress doc. Now it's a no-op except returning fresh aggregate.
    const payload = parseBody(event.body);
    const userId = payload.userId?.trim();
    if (!userId) {
      return respond(400, { error: "userId is required" });
    }
    const dto = await buildProgressDTO(userId);
    return respond(200, {
      progress: dto,
      note: "Progress model deprecated; derived from quiz attempts",
    });
  } catch (error) {
    console.error("[progress] handler error", error);
    return respond(500, { error: error.message || "Internal Server Error" });
  }
};
