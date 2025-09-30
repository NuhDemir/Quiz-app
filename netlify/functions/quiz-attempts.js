const connectDB = require("./db");
const QuizAttempt = require("../../models/QuizAttempt");
const {
  extractBearerToken,
  verifyToken,
  respond,
  createHttpError,
  handleError,
} = require("./auth-helpers");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return respond(204, {});
  if (event.httpMethod !== "GET")
    return respond(405, { error: "Method Not Allowed" });
  try {
    await connectDB();
    const token = extractBearerToken(event);
    const decoded = verifyToken(token);
    if (!decoded?.sub) throw createHttpError(401, "Unauthorized");

    const { limit = "20", offset = "0" } = event.queryStringParameters || {};
    const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const o = Math.max(0, parseInt(offset, 10) || 0);

    const attempts = await QuizAttempt.find({ user: decoded.sub })
      .sort({ createdAt: -1 })
      .skip(o)
      .limit(l)
      .populate({ path: "quiz", select: "title category level difficulty" })
      .select(
        "quiz questionCount correctCount wrongCount accuracy score createdAt meta"
      )
      .lean();

    const data = attempts.map((a) => ({
      id: a._id.toString(),
      quiz: a.quiz
        ? {
            id: a.quiz._id.toString(),
            title: a.quiz.title,
            category: a.quiz.category,
            level: a.quiz.level,
            difficulty: a.quiz.difficulty,
          }
        : null,
      questionCount: a.questionCount,
      correctCount: a.correctCount,
      wrongCount: a.wrongCount,
      accuracy: a.accuracy,
      score: a.score,
      streakDelta: a.meta?.streakDelta || 0,
      createdAt: a.createdAt,
    }));

    return respond(200, { attempts: data, count: data.length, offset: o });
  } catch (error) {
    return handleError(error, "quiz-attempts");
  }
};
