const connectDB = require("./db");
const { respond, handleError } = require("./auth-helpers");
const { requireAuthenticatedUser } = require("./lib/auth");
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
    await requireAuthenticatedUser(event);

    const params = event.queryStringParameters || {};
    let quiz;

    try {
      quiz = await loadQuizByIdentifier({ id: params.id, slug: params.slug });
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
    return handleError(error, "get-quiz-detail");
  }
};
