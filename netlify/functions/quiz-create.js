const connectDB = require("./db");
const Quiz = require("../../models/Quiz");
const Question = require("../../models/Question");
const User = require("../../models/User");
const {
  extractBearerToken,
  verifyToken,
  createHttpError,
} = require("./auth-helpers");

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

    // Auth & role kontrolü
    const token = extractBearerToken(event);
    if (!token) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Unauthorized" }),
      };
    }
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (e) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Invalid token" }),
      };
    }
    const user = await User.findById(decoded.sub);
    if (!user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "User not found" }),
      };
    }
    if (user.role !== "admin") {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Forbidden: admin only" }),
      };
    }

    const payload = parseBody(event.body);
    const { title, description, questions } = payload;

    if (!title || !Array.isArray(questions) || questions.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Title and questions array are required",
        }),
      };
    }

    const questionDocs = [];

    for (const question of questions) {
      if (question._id) {
        questionDocs.push(question._id);
        continue;
      }

      const { text, options, correctAnswer } = question;

      if (
        !text ||
        !Array.isArray(options) ||
        options.length < 2 ||
        !correctAnswer
      ) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error:
              "Each question must include text, at least two options, and the correctAnswer",
          }),
        };
      }

      const created = await Question.create({ text, options, correctAnswer });
      questionDocs.push(created._id);
    }

    const quiz = await Quiz.create({
      title,
      description,
      questions: questionDocs,
    });

    const populatedQuiz = await quiz.populate("questions");

    return {
      statusCode: 201,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(populatedQuiz),
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
