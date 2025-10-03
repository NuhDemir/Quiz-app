const mongoose = require("mongoose");
const Quiz = require("../../../models/Quiz");
require("../../../models/Question");

function normalizeIdentifier({ id, slug }) {
  const trimmedId = typeof id === "string" ? id.trim() : "";
  const trimmedSlug = typeof slug === "string" ? slug.trim().toLowerCase() : "";

  if (!trimmedId && !trimmedSlug) {
    const error = new Error(
      "Quiz detayı için id veya slug parametresi gerekli"
    );
    error.statusCode = 400;
    throw error;
  }

  if (trimmedId) {
    if (!mongoose.Types.ObjectId.isValid(trimmedId)) {
      const error = new Error("Geçersiz quiz id formatı");
      error.statusCode = 400;
      throw error;
    }

    return { query: { _id: trimmedId }, identifier: trimmedId };
  }

  return { query: { slug: trimmedSlug }, identifier: trimmedSlug };
}

function transformQuizDoc(doc) {
  if (!doc) return null;

  const quiz = {
    ...doc,
    id: doc._id ? doc._id.toString() : undefined,
    questionCount: Array.isArray(doc.questions)
      ? doc.questions.length
      : doc.questionCount || 0,
  };

  if (Array.isArray(quiz.questions)) {
    quiz.questions = quiz.questions.map((question) => ({
      ...question,
      id: question._id ? question._id.toString() : question.id,
    }));
  }

  return quiz;
}

async function fetchQuizDocument({ id, slug }) {
  const { query } = normalizeIdentifier({ id, slug });

  try {
    const doc = await Quiz.findOne(query).populate("questions");
    return doc;
  } catch (error) {
    error.statusCode = error.statusCode || 500;
    throw error;
  }
}

async function loadQuizByIdentifier({ id, slug, includeUnpublished = false }) {
  const { query } = normalizeIdentifier({ id, slug });

  if (!includeUnpublished) {
    query.isPublished = true;
  }

  try {
    const quizDoc = await Quiz.findOne(query).populate("questions").lean();
    if (!quizDoc) {
      return null;
    }

    return transformQuizDoc(quizDoc);
  } catch (error) {
    error.statusCode = error.statusCode || 500;
    throw error;
  }
}

module.exports = {
  fetchQuizDocument,
  loadQuizByIdentifier,
  transformQuizDoc,
};
