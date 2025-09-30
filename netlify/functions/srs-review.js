const connectDB = require("./db");
const User = require("../../models/User");
const ReviewLog = require("../../models/ReviewLog");
const WordEntry = require("../../models/WordEntry");
const {
  extractBearerToken,
  verifyToken,
  respond,
  createHttpError,
  handleError,
  parseBody,
} = require("./auth-helpers");

// Simple SM-2 like interval schedule baseline
function nextInterval(prevInterval, performance) {
  if (performance === "again") return 1; // 1 day
  if (performance === "hard")
    return Math.max(1, Math.round(prevInterval * 1.2));
  if (performance === "good")
    return Math.max(1, Math.round(prevInterval * 2.2));
  if (performance === "easy")
    return Math.max(1, Math.round(prevInterval * 3.2));
  return 1;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return respond(204, {});
  if (event.httpMethod !== "POST")
    return respond(405, { error: "Method Not Allowed" });
  try {
    await connectDB();
    const token = extractBearerToken(event);
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.sub);
    if (!user) throw createHttpError(404, "User not found");

    const body = parseBody(event.body);
    const { wordId, performance } = body; // performance: again|hard|good|easy
    if (!wordId || !performance)
      throw createHttpError(400, "wordId and performance are required");

    // Ensure WordEntry exists (shared dictionary). If not found, reject.
    const entry = await WordEntry.findById(wordId);
    if (!entry) throw createHttpError(404, "WordEntry not found");

    // Find or create wordProgress subdoc
    const wp = user.wordProgress.find((p) => p.wordEntry.toString() === wordId);
    const now = new Date();
    if (!wp) {
      user.wordProgress.push({
        wordEntry: entry._id,
        status: "learning",
        timesReviewed: 1,
        lastReviewedAt: now,
        nextReviewAt: new Date(now.getTime() + 24 * 3600 * 1000),
      });
    } else {
      wp.timesReviewed += 1;
      wp.lastReviewedAt = now;
      const prevIntervalDays =
        wp.nextReviewAt && wp.lastReviewedAt
          ? Math.max(
              1,
              Math.round(
                (wp.nextReviewAt - wp.lastReviewedAt) / (24 * 3600 * 1000)
              )
            )
          : 1;
      const newInterval = nextInterval(prevIntervalDays, performance);
      wp.nextReviewAt = new Date(
        now.getTime() + newInterval * 24 * 3600 * 1000
      );
      // Status promotion heuristic
      if (wp.timesReviewed >= 10) wp.status = "mastered";
      else if (wp.timesReviewed >= 5) wp.status = "review";
      else wp.status = "learning";
    }

    user.studyStats = user.studyStats || {};
    user.studyStats.totalReviews = (user.studyStats.totalReviews || 0) + 1;
    user.points = (user.points || 0) + 2; // small reward per review

    await user.save();

    const log = await ReviewLog.create({
      user: user._id,
      wordEntry: entry._id,
      rating: performance,
      scheduledAt: new Date(),
      reviewedAt: new Date(),
      intervalSec: 0, // could store actual interval diff
      nextReviewAt: user.wordProgress.find(
        (p) => p.wordEntry.toString() === wordId
      )?.nextReviewAt,
    });

    return respond(200, {
      success: true,
      wordProgress: user.wordProgress.find(
        (p) => p.wordEntry.toString() === wordId
      ),
      studyStats: user.studyStats,
      reviewLogId: log._id.toString(),
      points: user.points,
    });
  } catch (error) {
    return handleError(error, "srs-review");
  }
};
