const connectDB = require("./db");
const Quiz = require("../../models/Quiz");
const Question = require("../../models/Question");
const QuizAttempt = require("../../models/QuizAttempt");
const User = require("../../models/User");
const {
  extractBearerToken,
  verifyToken,
  createHttpError,
} = require("./auth-helpers");
const { evaluateAchievements } = require("./achievements-engine");
require("../../models/Badge");
require("../../models/Achievement");

function parseBody(body) {
  try {
    return body ? JSON.parse(body) : {};
  } catch (error) {
    throw new Error("Invalid JSON payload");
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { Allow: "POST" },
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    await connectDB();

    const payload = parseBody(event.body);
    const { quizId, answers, durationSec = 0 } = payload;

    if (!quizId || !Array.isArray(answers)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "quizId and answers array are required",
        }),
      };
    }

    const quiz = await Quiz.findById(quizId).populate("questions");

    if (!quiz) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Quiz not found" }),
      };
    }

    const answerMap = new Map(
      answers.map((entry) => [String(entry.questionId), entry.answer])
    );
    const totalQuestions = quiz.questions.length;
    let correctCount = 0;

    const details = [];

    const attemptAnswers = [];
    for (const question of quiz.questions) {
      const userAnswer = answerMap.get(String(question._id));
      const isCorrect =
        userAnswer !== undefined && userAnswer === question.correctAnswer;

      if (isCorrect) {
        correctCount += 1;
      }

      details.push({
        questionId: question._id,
        questionText: question.text,
        userAnswer: userAnswer ?? null,
        correctAnswer: question.correctAnswer,
        isCorrect,
      });
      attemptAnswers.push({
        question: question._id,
        selected: userAnswer ?? null,
        isCorrect,
        timeSpentSec: 0,
      });
    }

    const incorrectCount = totalQuestions - correctCount;
    const score =
      totalQuestions > 0
        ? Math.round((correctCount / totalQuestions) * 100)
        : 0;

    // Auth (optional but preferred for persistence)
    let user = null;
    try {
      const token = extractBearerToken(event);
      const decoded = verifyToken(token);
      user = await User.findById(decoded.sub);
    } catch (e) {
      // If auth fails, we still return quiz result but skip persistence.
    }

    let attemptId = null;
    let updatedStats = null;
    let newlyAwarded = [];
    if (user) {
      // Create QuizAttempt
      const accuracy = totalQuestions
        ? Math.round((correctCount / totalQuestions) * 100)
        : 0;

      const attempt = await QuizAttempt.create({
        user: user._id,
        quiz: quiz._id,
        questionCount: totalQuestions,
        correctCount,
        wrongCount: incorrectCount,
        accuracy,
        score,
        durationSec: durationSec || 0,
        startedAt: new Date(),
        finishedAt: new Date(),
        answers: attemptAnswers,
        meta: { streakDelta: 0, xpEarned: correctCount },
      });
      attemptId = attempt._id.toString();

      // Update aggregate quizStats on user
      user.quizStats = user.quizStats || {};
      user.quizStats.totalQuizzes = (user.quizStats.totalQuizzes || 0) + 1;
      user.quizStats.totalQuestions =
        (user.quizStats.totalQuestions || 0) + totalQuestions;
      user.quizStats.totalCorrect =
        (user.quizStats.totalCorrect || 0) + correctCount;
      user.quizStats.totalWrong =
        (user.quizStats.totalWrong || 0) + incorrectCount;

      // Simple streak logic: increment if at least one correct answer; otherwise reset.
      if (correctCount > 0) {
        user.quizStats.currentStreak = (user.quizStats.currentStreak || 0) + 1;
      } else {
        user.quizStats.currentStreak = 0;
      }
      user.quizStats.longestStreak = Math.max(
        user.quizStats.longestStreak || 0,
        user.quizStats.currentStreak || 0
      );

      // Category stats (increment attempts/correct)
      if (quiz.category) {
        const catKey = quiz.category;
        const cat = user.quizStats.category?.get?.(catKey) || {
          attempts: 0,
          correct: 0,
        };
        cat.attempts += 1;
        cat.correct += correctCount;
        if (!user.quizStats.category) user.quizStats.category = new Map();
        user.quizStats.category.set(catKey, cat);
      }

      // Level stats
      if (quiz.level) {
        const lvlKey = quiz.level;
        const lvl = user.quizStats.level?.get?.(lvlKey) || {
          attempts: 0,
          correct: 0,
        };
        lvl.attempts += 1;
        lvl.correct += correctCount;
        if (!user.quizStats.level) user.quizStats.level = new Map();
        user.quizStats.level.set(lvlKey, lvl);
      }

      // Points economy: simple rule -> + correctCount * 10
      user.points = (user.points || 0) + correctCount * 10;

      // Evaluate achievements BEFORE saving so both stats and new awards saved together
      const evalResult = await evaluateAchievements(user);
      newlyAwarded = evalResult.newlyAwarded || [];
      await user.save();
      updatedStats = {
        totalQuizzes: user.quizStats.totalQuizzes,
        totalQuestions: user.quizStats.totalQuestions,
        totalCorrect: user.quizStats.totalCorrect,
        totalWrong: user.quizStats.totalWrong,
        currentStreak: user.quizStats.currentStreak,
        longestStreak: user.quizStats.longestStreak,
        points: user.points,
        accuracy: user.accuracy,
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        quizId,
        score,
        totalQuestions,
        correctCount,
        incorrectCount,
        details,
        attemptId,
        userStats: updatedStats,
        persisted: Boolean(user),
        newlyAwarded,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
