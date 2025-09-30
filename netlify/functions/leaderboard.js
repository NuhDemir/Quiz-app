const connectDB = require("./db");
const User = require("../../models/User");
const { respond } = require("./auth-helpers");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return respond(204, {});
  if (event.httpMethod !== "GET")
    return respond(405, { error: "Method Not Allowed" });
  try {
    await connectDB();
    const {
      limit = "20",
      offset = "0",
      sort = "points",
    } = event.queryStringParameters || {};
    const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const o = Math.max(0, parseInt(offset, 10) || 0);

    const sortMap = {
      points: { points: -1, updatedAt: -1 },
      streak: { "quizStats.longestStreak": -1 },
      accuracy: { "quizStats.totalCorrect": -1 }, // simple proxy; could compute accuracy but expensive without projection
    };

    const users = await User.find({})
      .sort(sortMap[sort] || sortMap.points)
      .skip(o)
      .limit(l)
      .select(
        "username points charms quizStats.totalQuizzes quizStats.totalCorrect quizStats.totalWrong quizStats.longestStreak updatedAt"
      )
      .lean();

    const data = users.map((u) => {
      const total =
        (u.quizStats?.totalCorrect || 0) + (u.quizStats?.totalWrong || 0);
      const accuracy = total
        ? Number(((u.quizStats.totalCorrect / total) * 100).toFixed(2))
        : 0;
      return {
        id: u._id.toString(),
        username: u.username,
        points: u.points || 0,
        longestStreak: u.quizStats?.longestStreak || 0,
        totalQuizzes: u.quizStats?.totalQuizzes || 0,
        accuracy,
        updatedAt: u.updatedAt,
      };
    });

    return respond(200, { leaderboard: data, count: data.length, offset: o });
  } catch (error) {
    return respond(500, { error: error.message });
  }
};
