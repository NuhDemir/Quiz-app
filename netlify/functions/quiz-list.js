const connectDB = require("./db");
const Quiz = require("../../models/Quiz");

exports.handler = async () => {
  try {
    await connectDB();

    const quizzes = await Quiz.find({ isPublished: true })
      .select(
        "title description category level difficulty slug questionCount timeLimitSec questions meta"
      )
      .sort({ createdAt: -1 });

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
