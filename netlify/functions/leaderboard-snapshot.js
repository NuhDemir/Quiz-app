const connectDB = require("./db");
const LeaderboardSnapshot = require("../../models/LeaderboardSnapshot");
const User = require("../../models/User");
const {
  respond,
  extractBearerToken,
  verifyToken,
  createHttpError,
  handleError,
} = require("./auth-helpers");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return respond(204, {});
  if (event.httpMethod !== "POST")
    return respond(405, { error: "Method Not Allowed" });
  try {
    await connectDB();
    // Placeholder admin auth: require valid token (extend with role check later)
    const token = extractBearerToken(event);
    const decoded = verifyToken(token);
    if (!decoded) throw createHttpError(401, "Unauthorized");

    const topUsers = await User.find({})
      .sort({ points: -1 })
      .limit(50)
      .select(
        "username points quizStats.totalCorrect quizStats.totalWrong quizStats.longestStreak"
      )
      .lean();

    const entries = topUsers.map((u, idx) => {
      const total =
        (u.quizStats?.totalCorrect || 0) + (u.quizStats?.totalWrong || 0);
      const accuracy = total
        ? Number(((u.quizStats.totalCorrect / total) * 100).toFixed(2))
        : 0;
      return {
        user: u._id,
        username: u.username,
        points: u.points || 0,
        rank: idx + 1,
        accuracy,
        longestStreak: u.quizStats?.longestStreak || 0,
      };
    });

    const snapshot = await LeaderboardSnapshot.create({
      entries,
      meta: { totalUsersConsidered: topUsers.length },
    });
    return respond(200, {
      success: true,
      snapshotId: snapshot._id.toString(),
      createdAt: snapshot.createdAt,
    });
  } catch (error) {
    return handleError(error, "leaderboard-snapshot");
  }
};
