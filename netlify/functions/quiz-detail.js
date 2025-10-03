const connectDB = require("./db");
const { respond, handleError } = require("./auth-helpers");
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

    const params = event.queryStringParameters || {};
    const { id, slug } = params;

    if (!id && !slug) {
      return respond(400, {
        error: "Quiz detayı için id veya slug parametresi gerekli",
      });
    }

    let quiz;
    try {
      quiz = await loadQuizByIdentifier({ id, slug });
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
    return handleError(error, "quiz-detail");
  }
};
