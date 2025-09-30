const connectDB = require("./db");
const User = require("../../models/User");
const GrammarTopic = require("../../models/GrammarTopic");
const {
  extractBearerToken,
  verifyToken,
  parseBody,
  respond,
  createHttpError,
  handleError,
} = require("./auth-helpers");

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
    const { topicId, sectionId, score } = body; // sectionId optional; score optional
    if (!topicId) throw createHttpError(400, "topicId required");

    const topic = await GrammarTopic.findById(topicId);
    if (!topic) throw createHttpError(404, "GrammarTopic not found");

    // locate progress subdoc
    let gp = user.grammarProgress.find((p) => p.topic.toString() === topicId);
    if (!gp) {
      gp = {
        topic: topic._id,
        completedSections: [],
        attempts: 0,
        score: 0,
        progressPercent: 0,
      };
      user.grammarProgress.push(gp);
    }

    gp.attempts += 1;
    if (typeof score === "number") gp.score = Math.max(gp.score, score);
    if (sectionId && !gp.completedSections.includes(sectionId)) {
      gp.completedSections.push(sectionId);
    }

    // progress percent heuristic: completed sections / total sections
    if (Array.isArray(topic.sections) && topic.sections.length) {
      gp.progressPercent = Math.round(
        (gp.completedSections.length / topic.sections.length) * 100
      );
    }
    gp.lastReviewedAt = new Date();

    user.points = (user.points || 0) + 5; // reward grammar study
    await user.save();

    return respond(200, {
      success: true,
      grammarProgress: gp,
      points: user.points,
    });
  } catch (error) {
    return handleError(error, "grammar-progress");
  }
};
