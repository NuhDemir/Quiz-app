const mongoose = require("mongoose");
const connectDB = require("./db");
const VocabularyCategory = require("../../models/VocabularyCategory");
const WordEntry = require("../../models/WordEntry");
const User = require("../../models/User");
const {
  extractBearerToken,
  verifyToken,
  parseBody,
  respond,
  handleError,
  createHttpError,
  requireRole,
} = require("./auth-helpers");

const ensureAdmin = async (event) => {
  const token = extractBearerToken(event);
  const decoded = verifyToken(token);
  const user = await User.findById(decoded.sub);
  requireRole(user, ["admin"]);
  return user;
};

const sanitizeCategoryPayload = (payload = {}) => {
  const fields = [
    "name",
    "slug",
    "description",
    "level",
    "color",
    "icon",
    "order",
    "isActive",
    "parent",
    "metadata",
  ];
  const sanitized = {};
  fields.forEach((field) => {
    if (payload[field] !== undefined) {
      sanitized[field] = payload[field];
    }
  });
  return sanitized;
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return respond(204, {});

  try {
    await connectDB();

    if (event.httpMethod === "GET") {
      const params = event.queryStringParameters || {};
      const includeInactive = params.includeInactive === "1";
      const filter = includeInactive ? {} : { isActive: true };

      const categories = await VocabularyCategory.find(filter)
        .sort({ order: 1, name: 1 })
        .lean();

      const counts = await WordEntry.aggregate([
        { $match: { owner: { $exists: false } } },
        {
          $group: {
            _id: "$category",
            total: { $sum: 1 },
          },
        },
      ]);

      const countMap = counts.reduce((acc, item) => {
        if (item._id) acc[item._id.toString()] = item.total;
        return acc;
      }, {});

      const items = categories.map((cat) => ({
        ...cat,
        wordCount: countMap[cat._id.toString()] || 0,
      }));

      return respond(200, { items });
    }

    if (event.httpMethod === "POST") {
      await ensureAdmin(event);
      const body = parseBody(event.body);
      const payload = sanitizeCategoryPayload(body);

      if (!payload.name || !payload.slug) {
        throw createHttpError(400, "name and slug are required");
      }

      if (payload.parent && !mongoose.Types.ObjectId.isValid(payload.parent)) {
        throw createHttpError(400, "Invalid parent category id");
      }

      const category = await VocabularyCategory.create(payload);
      return respond(201, { item: category.toObject() });
    }

    if (event.httpMethod === "PUT") {
      await ensureAdmin(event);
      const body = parseBody(event.body);
      const { id } = body;
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw createHttpError(400, "Category id is required");
      }
      const payload = sanitizeCategoryPayload(body);
      const updated = await VocabularyCategory.findByIdAndUpdate(
        id,
        { $set: payload },
        { new: true, runValidators: true }
      );
      if (!updated) {
        throw createHttpError(404, "Category not found");
      }
      return respond(200, { item: updated.toObject() });
    }

    if (event.httpMethod === "DELETE") {
      await ensureAdmin(event);
      const params = event.queryStringParameters || {};
      const { id } = params;
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw createHttpError(400, "Category id is required");
      }

      // Soft delete by toggling isActive
      await VocabularyCategory.findByIdAndUpdate(id, {
        $set: { isActive: false },
      });

      return respond(200, { success: true });
    }

    return respond(405, { error: "Method Not Allowed" });
  } catch (error) {
    return handleError(error, "vocabulary-categories");
  }
};
