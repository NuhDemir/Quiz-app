const connectDB = require("./db");
const { respond, handleError, createHttpError } = require("./auth-helpers");
const { requireAdmin } = require("./admin-helpers");
const { loadQuizByIdentifier } = require("./lib/quiz-service");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return respond(204, {});
  }

  if (event.httpMethod !== "GET") {
    return respond(405, { error: "Method Not Allowed" });
  }

  try {
    await connectDB();
    await requireAdmin(event);

    const params = event.queryStringParameters || {};

    let quiz;
    try {
      quiz = await loadQuizByIdentifier({
        id: params.id,
        slug: params.slug,
        includeUnpublished: true,
      });
    } catch (error) {
      if (error.statusCode) {
        return respond(error.statusCode, { error: error.message });
      }
      throw error;
    }

    if (!quiz) {
      return respond(404, { error: "Quiz bulunamadı" });
    }

    return respond(200, { quiz });
  } catch (error) {
    return handleError(error, "admin-quiz-detail");
  }
};
