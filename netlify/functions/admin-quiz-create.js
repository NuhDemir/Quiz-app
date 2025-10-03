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

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return respond(204, {});
  }

  if (event.httpMethod !== "POST") {
    return respond(405, { error: "Method Not Allowed" });
  }

  try {
    await connectDB();
    const admin = await requireAdmin(event);

    const payload = parseBody(event.body);
    const quizData = validateQuizPayload(payload, { partial: false });

    if (!quizData.slug) {
      throw createHttpError(400, "Slug alanı zorunludur");
    }

    const existing = await Quiz.findOne({ slug: quizData.slug });
    if (existing) {
      throw createHttpError(409, "Bu slug zaten kullanımda");
    }

    const questionDocs = await Question.insertMany(
      (quizData.questions || []).map((question) => ({
        text: question.text,
        explanation: question.explanation,
        options: question.options,
        correctAnswer: question.correctAnswer,
        category: quizData.category,
        level: question.level || quizData.level,
        difficulty: question.difficulty || quizData.difficulty,
        tags: question.tags,
        author: admin._id,
      }))
    );

    const quiz = new Quiz({
      title: quizData.title,
      slug: quizData.slug,
      description: quizData.description,
      category: quizData.category,
      level: quizData.level,
      difficulty: quizData.difficulty,
      timeLimitSec: quizData.timeLimitSec,
      isPublished: quizData.isPublished ?? false,
      tags: quizData.tags,
      questions: questionDocs.map((doc) => doc._id),
      author: admin._id,
    });

    await quiz.save();

    return respond(201, {
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
        createdAt: quiz.createdAt,
        updatedAt: quiz.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      error.statusCode = 400;
    }
    return handleError(error, "admin-quiz-create");
  }
};
