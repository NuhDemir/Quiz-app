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

async function buildQuestionDocs({ quizData, admin }) {
  const questions = quizData.questions || [];
  if (!questions.length) {
    throw createHttpError(400, "Quiz en az bir soru içermelidir.");
  }

  return Question.insertMany(
    questions.map((question) => ({
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
}

function extractImportPayload(raw) {
  if (!raw || typeof raw !== "object") {
    throw createHttpError(400, "Geçersiz içe aktarma isteği");
  }

  const quizSection = raw.quiz || raw.meta || raw.details;
  if (!quizSection || typeof quizSection !== "object") {
    throw createHttpError(400, "'quiz' alanı bulunamadı");
  }

  const questions = Array.isArray(raw.questions)
    ? raw.questions
    : Array.isArray(raw.items)
    ? raw.items
    : null;

  if (!questions || !questions.length) {
    throw createHttpError(400, "En az bir soru sağlamalısınız");
  }

  return {
    ...quizSection,
    questions,
  };
}

function buildResponse({ quiz, action, questionCount }) {
  return {
    status: "success",
    action,
    message:
      action === "created"
        ? `Quiz '${quiz.title}' içe aktarıldı.`
        : `Quiz '${quiz.title}' güncellendi.`,
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
      tags: quiz.tags,
      updatedAt: quiz.updatedAt,
      createdAt: quiz.createdAt,
    },
    stats: {
      questionCount,
    },
  };
}

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
    const normalized = extractImportPayload(payload);
    const quizData = validateQuizPayload(normalized, { partial: false });

    const existingQuiz = await Quiz.findOne({ slug: quizData.slug });

    if (!existingQuiz && !quizData.slug) {
      throw createHttpError(400, "Slug alanı zorunludur");
    }

    const questionDocs = await buildQuestionDocs({
      quizData,
      admin,
    });

    const questionIds = questionDocs.map((doc) => doc._id);

    let resultQuiz;
    let action;

    if (existingQuiz) {
      existingQuiz.title = quizData.title;
      existingQuiz.description = quizData.description;
      existingQuiz.category = quizData.category;
      existingQuiz.level = quizData.level;
      existingQuiz.difficulty = quizData.difficulty;
      existingQuiz.timeLimitSec = quizData.timeLimitSec;
      existingQuiz.isPublished =
        quizData.isPublished ?? existingQuiz.isPublished;
      existingQuiz.tags = Array.isArray(quizData.tags) ? quizData.tags : [];
      existingQuiz.questions = questionIds;
      existingQuiz.author = admin._id;

      await existingQuiz.save();
      resultQuiz = existingQuiz;
      action = "updated";
    } else {
      const quiz = new Quiz({
        title: quizData.title,
        slug: quizData.slug,
        description: quizData.description,
        category: quizData.category,
        level: quizData.level,
        difficulty: quizData.difficulty,
        timeLimitSec: quizData.timeLimitSec,
        isPublished: quizData.isPublished ?? false,
        tags: Array.isArray(quizData.tags) ? quizData.tags : [],
        questions: questionIds,
        author: admin._id,
      });

      await quiz.save();
      resultQuiz = quiz;
      action = "created";
    }

    const statusCode = action === "created" ? 201 : 200;

    return respond(
      statusCode,
      buildResponse({
        quiz: resultQuiz,
        action,
        questionCount: questionIds.length,
      })
    );
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      error.statusCode = 400;
    }

    return handleError(error, "admin-quiz-import");
  }
};
