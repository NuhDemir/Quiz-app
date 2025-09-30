const connectDB = require("./db");
const DailyUserStat = require("../../models/DailyUserStat");
const QuizAttempt = require("../../models/QuizAttempt");
const ReviewLog = require("../../models/ReviewLog");
const User = require("../../models/User");
const {
  respond,
  createHttpError,
  handleError,
  extractBearerToken,
  verifyToken,
} = require("./auth-helpers");

// This function can be triggered manually or by a scheduled Netlify build hook.
// It aggregates current day stats for the authenticated user (or for all users if admin flag set).

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return respond(204, {});
  if (event.httpMethod !== "POST")
    return respond(405, { error: "Method Not Allowed" });
  try {
    await connectDB();
    const token = extractBearerToken(event);
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.sub);
    if (!user) throw createHttpError(404, "User not found");

    const isAdmin = false; // placeholder; integrate real admin check later

    const sod = startOfDay();
    const eod = endOfDay();

    if (isAdmin) {
      // Aggregate all users (simple loop; could be optimized with aggregation pipelines)
      const users = await User.find({});
      for (const u of users) {
        await aggregateForUser(u, sod, eod);
      }
      return respond(200, { success: true, scope: "all" });
    } else {
      await aggregateForUser(user, sod, eod);
      return respond(200, { success: true, scope: "user" });
    }
  } catch (error) {
    return handleError(error, "daily-stats");
  }
};

async function aggregateForUser(user, sod, eod) {
  const attempts = await QuizAttempt.find({
    user: user._id,
    createdAt: { $gte: sod, $lte: eod },
  }).lean();
  const reviews = await ReviewLog.find({
    user: user._id,
    reviewedAt: { $gte: sod, $lte: eod },
  }).lean();

  const quizzesCompleted = attempts.length;
  const questionsAnswered = attempts.reduce(
    (a, at) => a + (at.questionCount || 0),
    0
  );
  const correctAnswers = attempts.reduce(
    (a, at) => a + (at.correctCount || 0),
    0
  );
  const totalReviewCount = reviews.length;
  const wordsReviewed = new Set(reviews.map((r) => r.wordEntry?.toString()))
    .size;

  const accuracy = questionsAnswered
    ? Math.round((correctAnswers / questionsAnswered) * 100)
    : 0;

  await DailyUserStat.findOneAndUpdate(
    { user: user._id, date: sod },
    {
      $set: {
        quizzesCompleted,
        questionsAnswered,
        correctAnswers,
        reviewSessions: totalReviewCount,
        wordsReviewed,
        accuracy,
      },
    },
    { upsert: true }
  );
}
