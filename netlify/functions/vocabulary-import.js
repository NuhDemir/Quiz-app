const mongoose = require("mongoose");
const connectDB = require("./db");
const VocabularyCategory = require("../../models/VocabularyCategory");
const WordEntry = require("../../models/WordEntry");
const {
  respond,
  handleError,
  parseBody,
  createHttpError,
} = require("./auth-helpers");
const { requireAdmin } = require("./admin-helpers");
const {
  validateVocabularyImportPayload,
} = require("./validation/vocabularyImportSchema");

async function upsertCategories(categories) {
  const map = new Map();
  for (const cat of categories || []) {
    const slug = cat.slug;
    if (!slug) continue;
    let found = await VocabularyCategory.findOne({ slug });
    if (found) {
      // update some fields if provided
      if (cat.name) found.name = cat.name;
      if (cat.description != null) found.description = cat.description;
      if (cat.level != null) found.level = cat.level;
      if (cat.color != null) found.color = cat.color;
      if (typeof cat.isActive === "boolean") found.isActive = cat.isActive;
      await found.save();
    } else {
      found = await VocabularyCategory.create({
        name: cat.name || slug,
        slug,
        description: cat.description,
        level: cat.level,
        color: cat.color,
        isActive: typeof cat.isActive === "boolean" ? cat.isActive : true,
      });
    }
    map.set(slug, found);
  }
  return map;
}

async function resolveOrCreateCategory(catInput) {
  if (!catInput) return null;
  const slug = catInput.slug || catInput.id || catInput.name;
  const slugKey = String(slug).toLowerCase();
  let found = await VocabularyCategory.findOne({ slug: slugKey });
  if (found) return found;
  // create minimal category
  const created = await VocabularyCategory.create({
    name: catInput.name || slugKey,
    slug: slugKey,
    level: catInput.level || "unknown",
    color: catInput.color || "#2563eb",
    isActive: catInput.isActive !== false,
  });
  return created;
}

function normalizeTerm(term) {
  return String(term || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return respond(204, {});
  if (event.httpMethod !== "POST")
    return respond(405, { error: "Method Not Allowed" });

  try {
    await connectDB();
    const admin = await requireAdmin(event);

    const payload = parseBody(event.body);
    const validated = validateVocabularyImportPayload(payload);

    // upsert provided categories first
    const providedCategories = validated.categories || [];
    const categoryMap = await upsertCategories(providedCategories);

    let created = 0;
    let updated = 0;

    for (const w of validated.words) {
      // resolve main category
      let categoryId = null;
      if (w.category && w.category.slug) {
        const slug = w.category.slug.toLowerCase();
        const cat =
          categoryMap.get(slug) || (await VocabularyCategory.findOne({ slug }));
        if (cat) categoryId = cat._id;
        else {
          const newCat = await resolveOrCreateCategory(w.category);
          categoryMap.set(newCat.slug, newCat);
          categoryId = newCat._id;
        }
      }

      const subcategoryIds = [];
      for (const sub of w.subcategories || []) {
        const slug = sub.slug.toLowerCase();
        let subCat =
          categoryMap.get(slug) || (await VocabularyCategory.findOne({ slug }));
        if (!subCat) {
          subCat = await resolveOrCreateCategory(sub);
          categoryMap.set(subCat.slug, subCat);
        }
        if (subCat) subcategoryIds.push(subCat._id);
      }

      const normalized = normalizeTerm(w.term);
      const existing = await WordEntry.findOne({
        normalizedTerm: normalized,
        language: w.language,
      });

      if (existing) {
        // update fields
        existing.term = w.term;
        existing.translation = w.translation || existing.translation;
        existing.definition = w.definition || existing.definition;
        existing.examples =
          Array.isArray(w.examples) && w.examples.length
            ? w.examples
            : existing.examples;
        existing.notes = w.notes || existing.notes;
        existing.level = w.level || existing.level;
        existing.difficulty = w.difficulty || existing.difficulty;
        existing.status = w.status || existing.status;
        existing.category = categoryId || existing.category;
        existing.subcategories = subcategoryIds.length
          ? subcategoryIds
          : existing.subcategories;
        existing.tags = Array.isArray(w.tags) ? w.tags : existing.tags;
        existing.decks = w.decks || existing.decks;
        existing.spacedRepetition =
          w.spacedRepetition || existing.spacedRepetition;
        existing.lastEditor = admin._id;
        await existing.save();
        updated++;
      } else {
        const doc = new WordEntry({
          term: w.term,
          translation: w.translation,
          definition: w.definition,
          language: w.language,
          examples: w.examples,
          notes: w.notes,
          level: w.level,
          difficulty: w.difficulty,
          status: w.status,
          category: categoryId,
          subcategories: subcategoryIds,
          tags: w.tags,
          decks: w.decks,
          spacedRepetition: w.spacedRepetition,
          author: admin._id,
          lastEditor: admin._id,
        });
        await doc.save();
        created++;
      }
    }

    return respond(201, {
      status: "success",
      message: `Vocabulary import completed. ${created} created, ${updated} updated.`,
      stats: { created, updated, total: validated.words.length },
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      error.statusCode = 400;
    }
    return handleError(error, "vocabulary-import");
  }
};
