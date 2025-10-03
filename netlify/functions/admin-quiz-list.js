const connectDB = require("./db");
const Quiz = require("../../models/Quiz");
const { respond, handleError } = require("./auth-helpers");
const { requireAdmin } = require("./admin-helpers");
const { validateListQuery } = require("./validation/adminQuizSchema");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return respond(204, {});
  }

  if (event.httpMethod !== "GET") {
    return respond(405, { error: "Method Not Allowed" });
  }

  try {
    await connectDB();
    await requireAdmin(event);

    const params = event.queryStringParameters || {};
    const filters = validateListQuery(params);
    const page = Math.max(1, parseInt(params.page, 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(params.pageSize, 10) || 20)
    );

    const query = {};
    if (filters.category) query.category = filters.category;
    if (filters.level) query.level = filters.level;
    if (filters.difficulty) query.difficulty = filters.difficulty;
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: "i" } },
        { slug: { $regex: filters.search, $options: "i" } },
      ];
    }

    const sortField = params.sortBy || "createdAt";
    const sortOrder = params.sortOrder === "asc" ? 1 : -1;
    const sort = { [sortField]: sortOrder };

    const total = await Quiz.countDocuments(query);
    const items = await Quiz.find(query)
      .sort(sort)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .select(
        "title slug category level difficulty isPublished questionCount timeLimitSec createdAt updatedAt"
      )
      .lean();

    return respond(200, {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
      filters,
    });
  } catch (error) {
    return handleError(error, "admin-quiz-list");
  }
};
