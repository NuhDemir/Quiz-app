const connectDB = require("./db");
const Quiz = require("../../models/Quiz");

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const respond = (statusCode, payload) => ({
  statusCode,
  headers: DEFAULT_HEADERS,
  body: JSON.stringify(payload),
});

const escapeRegex = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildRegexArray = (input = "") =>
  input
    .split(",")
    .map((val) => val.trim())
    .filter(Boolean)
    .map((val) => new RegExp(escapeRegex(val), "i"));

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return respond(204, {});
  }

  if (event.httpMethod !== "GET") {
    return respond(405, { error: "Method Not Allowed" });
  }

  try {
    await connectDB();

    const {
      category = "",
      tags = "",
      search = "",
      difficulty = "",
      level = "",
      limit = "",
      mode = "",
    } = event.queryStringParameters || {};

    const filter = { isPublished: true };
    const andConditions = [];

    const modeNormalized = mode.trim().toLowerCase();
    if (modeNormalized === "vocabulary") {
      const vocabRegex = /(vocab|kelime)/i;
      andConditions.push({
        $or: [
          { category: { $regex: vocabRegex } },
          { tags: { $in: [vocabRegex] } },
        ],
      });
    }

    const categoryRegexes = buildRegexArray(category);
    if (categoryRegexes.length) {
      andConditions.push({
        $or: [
          { category: { $in: categoryRegexes } },
          { tags: { $in: categoryRegexes } },
        ],
      });
    }

    const tagRegexes = buildRegexArray(tags);
    if (tagRegexes.length) {
      andConditions.push({ tags: { $in: tagRegexes } });
    }

    const levelFilters = level
      .split(",")
      .map((val) => val.trim().toUpperCase())
      .filter(Boolean);
    if (levelFilters.length) {
      filter.level = { $in: levelFilters };
    }

    const difficultyFilters = difficulty
      .split(",")
      .map((val) => val.trim().toLowerCase())
      .filter(Boolean);
    if (difficultyFilters.length) {
      filter.difficulty = { $in: difficultyFilters };
    }

    if (search.trim()) {
      const safeSearch = escapeRegex(search.trim());
      const searchRegex = new RegExp(safeSearch, "i");
      andConditions.push({
        $or: [
          { title: { $regex: searchRegex } },
          { description: { $regex: searchRegex } },
          { tags: { $in: [searchRegex] } },
        ],
      });
    }

    if (andConditions.length) {
      filter.$and = andConditions;
    }

    let query = Quiz.find(filter)
      .select(
        "title description category level difficulty slug questionCount timeLimitSec tags meta createdAt updatedAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    const numericLimit = Number.parseInt(limit, 10);
    if (!Number.isNaN(numericLimit) && numericLimit > 0) {
      query = query.limit(Math.min(numericLimit, 100));
    }

    const quizzes = await query.exec();

    return respond(200, {
      items: quizzes,
      meta: {
        count: quizzes.length,
        filter: {
          category: categoryRegexes.map((regex) => regex.source),
          tags: tagRegexes.map((regex) => regex.source),
          level: levelFilters,
          difficulty: difficultyFilters,
          mode: modeNormalized || null,
          search: search.trim() || null,
        },
      },
    });
  } catch (error) {
    console.error("[quiz-list]", error);
    return respond(500, {
      error: error.message || "Internal Server Error",
    });
  }
};
