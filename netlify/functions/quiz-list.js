const connectDB = require("./db");
const Quiz = require("../../models/Quiz");

exports.handler = async () => {
  try {
    await connectDB();

    const quizzes = await Quiz.find().select("title description questions");

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(quizzes),
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
