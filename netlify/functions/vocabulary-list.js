const mongoose = require("mongoose");
const connectDB = require("./db");
const WordEntry = require("../../models/WordEntry");
const VocabularyCategory = require("../../models/VocabularyCategory");
const { respond, handleError } = require("./auth-helpers");

const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 100;

const parseLimit = (value) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed <= 0) return DEFAULT_PAGE_SIZE;
  return Math.min(parsed, MAX_PAGE_SIZE);
};

const resolveCategoryFilter = async (categoryParam) => {
  if (!categoryParam) return null;
  if (mongoose.Types.ObjectId.isValid(categoryParam)) {
    return new mongoose.Types.ObjectId(categoryParam);
  }
  const category = await VocabularyCategory.findOne({ slug: categoryParam });
  return category ? category._id : null;
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return respond(204, {});
  if (event.httpMethod !== "GET")
    return respond(405, { error: "Method Not Allowed" });

  try {
    await connectDB();

    const params = event.queryStringParameters || {};
    const limit = parseLimit(params.limit);
    const cursor = params.cursor ? Number(params.cursor) : 0;
    const status = params.status || "published";
    const deck = params.deck || null;
    const level = params.level || null;
    const search = params.search?.trim();

    const filter = {
      owner: { $exists: false },
    };

    if (status !== "all") {
      filter.status = status;
    }

    if (level) {
      filter.level = level;
    }

    if (deck === "learn") {
      filter["decks.learn.isEnabled"] = true;
    } else if (deck === "review") {
      filter["decks.review.isEnabled"] = true;
    }

    const categoryId = await resolveCategoryFilter(params.category);
    if (categoryId) {
      filter.$or = [{ category: categoryId }, { subcategories: categoryId }];
    }

    if (search) {
      const regex = new RegExp(
        search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );
      filter.$or = filter.$or || [];
      filter.$or.push({ term: regex }, { translation: regex }, { tags: regex });
    }

    const query = WordEntry.find(filter)
      .populate({ path: "category", select: "name slug color" })
      .sort({ term: 1 })
      .skip(cursor)
      .limit(limit);

    const [items, total] = await Promise.all([
      query.lean(),
      WordEntry.countDocuments(filter),
    ]);

    const nextCursor =
      cursor + items.length < total ? cursor + items.length : null;

    return respond(200, {
      items,
      total,
      cursor,
      nextCursor,
      pageSize: limit,
    });
  } catch (error) {
    return handleError(error, "vocabulary-list");
  }
};
