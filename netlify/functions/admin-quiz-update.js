const mongoose = require("mongoose");
const connectDB = require("./db");
const Quiz = require("../../models/Quiz");
const Question = require("../../models/Question");
const {
  respond,
  handleError,
  parseBody,
  createHttpError,
} = require("./auth-helpers");
const { requireAdmin } = require("./admin-helpers");
const { validateQuizPayload } = require("./validation/adminQuizSchema");

async function upsertQuestions(quiz, questions, admin) {
  if (!Array.isArray(questions) || !questions.length) {
    return quiz.questions;
  }

  const resultIds = [];

  for (const question of questions) {
    const base = {
      text: question.text,
      explanation: question.explanation,
      options: question.options,
      correctAnswer: question.correctAnswer,
      category: quiz.category,
      level: question.level || quiz.level,
      difficulty: question.difficulty || quiz.difficulty,
      tags: question.tags,
      author: admin._id,
    };

    if (question.id && mongoose.Types.ObjectId.isValid(question.id)) {
      const existing = await Question.findById(question.id);
      if (existing) {
        existing.set(base);
        await existing.save();
        resultIds.push(existing._id);
        continue;
      }
    }

    const created = await Question.create(base);
    resultIds.push(created._id);
  }

  return resultIds;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return respond(204, {});
  }

  if (event.httpMethod !== "PUT" && event.httpMethod !== "PATCH") {
    return respond(405, { error: "Method Not Allowed" });
  }

  try {
    await connectDB();
    const admin = await requireAdmin(event);

    const { id } = event.queryStringParameters || {};
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw createHttpError(400, "Geçerli bir quiz id değeri gereklidir");
    }

    const quiz = await Quiz.findById(id);
    if (!quiz) {
      throw createHttpError(404, "Quiz bulunamadı");
    }

    const payload = parseBody(event.body);
    const quizData = validateQuizPayload(payload, { partial: true });

    if (quizData.slug) {
      const slugConflict = await Quiz.findOne({
        slug: quizData.slug,
        _id: { $ne: quiz._id },
      });
      if (slugConflict) {
        throw createHttpError(
          409,
          "Bu slug başka bir quiz tarafından kullanılıyor"
        );
      }
      quiz.slug = quizData.slug;
    }

    if (quizData.title != null) quiz.title = quizData.title;
    if (quizData.description != null) quiz.description = quizData.description;
    if (quizData.category != null) quiz.category = quizData.category;
    if (quizData.level != null) quiz.level = quizData.level;
    if (quizData.difficulty != null) quiz.difficulty = quizData.difficulty;
    if (quizData.timeLimitSec != null)
      quiz.timeLimitSec = quizData.timeLimitSec;
    if (quizData.isPublished != null) quiz.isPublished = quizData.isPublished;
    if (quizData.tags != null) quiz.tags = quizData.tags;

    if (quizData.questions) {
      const newQuestionIds = await upsertQuestions(
        quiz,
        quizData.questions,
        admin
      );
      quiz.questions = newQuestionIds;
    }

    await quiz.save();

    return respond(200, {
      quiz: {
        id: quiz._id.toString(),
        title: quiz.title,
        slug: quiz.slug,
        category: quiz.category,
        level: quiz.level,
        difficulty: quiz.difficulty,
        isPublished: quiz.isPublished,
        questionCount: quiz.questionCount,
        timeLimitSec: quiz.timeLimitSec,
        updatedAt: quiz.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      error.statusCode = 400;
    }
    return handleError(error, "admin-quiz-update");
  }
};
