const mongoose = require("mongoose");
const connectDB = require("./db");
const Quiz = require("../../models/Quiz");

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { Allow: "GET" },
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    await connectDB();

    const { id } = event.queryStringParameters || {};

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing quiz id parameter" }),
      };
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid quiz id" }),
      };
    }

    const quiz = await Quiz.findById(id).populate("questions");

    if (!quiz) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Quiz not found" }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(quiz),
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
