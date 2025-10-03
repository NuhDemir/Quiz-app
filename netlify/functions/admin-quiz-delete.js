const mongoose = require("mongoose");
const connectDB = require("./db");
const Quiz = require("../../models/Quiz");
const Question = require("../../models/Question");
const { respond, handleError, createHttpError } = require("./auth-helpers");
const { requireAdmin } = require("./admin-helpers");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return respond(204, {});
  }

  if (event.httpMethod !== "DELETE") {
    return respond(405, { error: "Method Not Allowed" });
  }

  try {
    await connectDB();
    await requireAdmin(event);

    const { id } = event.queryStringParameters || {};
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw createHttpError(400, "Geçerli bir quiz id değeri gereklidir");
    }

    const quiz = await Quiz.findById(id);
    if (!quiz) {
      throw createHttpError(404, "Quiz bulunamadı");
    }

    const questionIds = quiz.questions || [];

    await Quiz.deleteOne({ _id: quiz._id });

    if (questionIds.length) {
      await Question.deleteMany({ _id: { $in: questionIds } });
    }

    return respond(200, {
      deleted: true,
      id: id.toString(),
    });
  } catch (error) {
    return handleError(error, "admin-quiz-delete");
  }
};
