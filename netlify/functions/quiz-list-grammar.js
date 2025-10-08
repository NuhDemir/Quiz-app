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

const GRAMMAR_REGEX = new RegExp(
  ["grammar", "gramer", "grammatik", "syntax"].map(escapeRegex).join("|"),
  "i"
);

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
      level = "",
      difficulty = "",
      search = "",
      tags = "",
      limit = "",
    } = event.queryStringParameters || {};

    const filter = { isPublished: true };
    const andConditions = [
      {
        $or: [
          { category: { $regex: GRAMMAR_REGEX } },
          { tags: { $in: [GRAMMAR_REGEX] } },
          { slug: { $regex: GRAMMAR_REGEX } },
          { title: { $regex: GRAMMAR_REGEX } },
        ],
      },
    ];

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

    const tagRegexes = buildRegexArray(tags);
    if (tagRegexes.length) {
      andConditions.push({ tags: { $in: tagRegexes } });
    }

    if (search.trim()) {
      const searchRegex = new RegExp(escapeRegex(search.trim()), "i");
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
        category: "grammar",
        filter: {
          level: levelFilters,
          difficulty: difficultyFilters,
          tags: tagRegexes.map((regex) => regex.source),
          search: search.trim() || null,
        },
      },
    });
  } catch (error) {
    console.error("[quiz-list-grammar]", error);
    return respond(500, {
      error: error.message || "Internal Server Error",
    });
  }
};
