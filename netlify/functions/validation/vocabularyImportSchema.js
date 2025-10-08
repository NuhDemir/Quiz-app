const { createHttpError } = require("../auth-helpers");

const LEVELS = new Set(["A1", "A2", "B1", "B2", "C1", "C2", "unknown"]);
const DIFFICULTIES = new Set(["easy", "medium", "hard"]);
const STATUSES = new Set(["draft", "published", "archived"]);

const DEFAULT_DECKS = Object.freeze({
  learn: {
    isEnabled: true,
    initialIntervalDays: 0,
    batchLimit: 20,
  },
  review: {
    isEnabled: true,
    intervalModifier: 1,
    maxIntervalDays: 30,
  },
});

const DEFAULT_SPACED = Object.freeze({
  easeFactor: 2.5,
  interval: 0,
  repetition: 0,
});

function normalizeString(value) {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  return "";
}

function ensureString(
  value,
  field,
  { required = false, maxLength, allowNull = false } = {}
) {
  if (value == null) {
    if (required) {
      throw createHttpError(400, `${field} alanı zorunludur.`);
    }
    return allowNull ? null : undefined;
  }

  const normalized = normalizeString(value);
  if (!normalized) {
    if (required) {
      throw createHttpError(400, `${field} alanı zorunludur.`);
    }
    return allowNull ? null : undefined;
  }

  if (maxLength && normalized.length > maxLength) {
    throw createHttpError(
      400,
      `${field} en fazla ${maxLength} karakter olabilir.`
    );
  }

  return normalized;
}

function ensureEnum(
  value,
  field,
  allowedSet,
  { required = false, defaultValue } = {}
) {
  if (value == null || value === "") {
    if (required && defaultValue == null) {
      throw createHttpError(400, `${field} alanı zorunludur.`);
    }
    return defaultValue ?? null;
  }

  const normalized = normalizeString(value).toLowerCase();
  for (const option of allowedSet) {
    if (option.toLowerCase() === normalized) {
      return option;
    }
  }

  throw createHttpError(400, `${field} değeri geçersiz.`);
}

function ensureBoolean(value, field, { defaultValue = false } = {}) {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }
  if (typeof value === "boolean") return value;
  const normalized = normalizeString(value).toLowerCase();
  if (["true", "1", "yes"].includes(normalized)) return true;
  if (["false", "0", "no"].includes(normalized)) return false;
  throw createHttpError(400, `${field} değeri geçersiz.`);
}

function ensureNumber(value, field, { min, max, allowNull = false } = {}) {
  if (value === undefined || value === null || value === "") {
    if (allowNull) return null;
    throw createHttpError(400, `${field} alanı zorunludur.`);
  }
  const num = Number(value);
  if (Number.isNaN(num)) {
    throw createHttpError(400, `${field} sayısal olmalıdır.`);
  }
  if (min != null && num < min) {
    throw createHttpError(400, `${field} en az ${min} olabilir.`);
  }
  if (max != null && num > max) {
    throw createHttpError(400, `${field} en fazla ${max} olabilir.`);
  }
  return num;
}

function slugify(value) {
  const normalized = normalizeString(value).toLowerCase();
  return normalized
    .replace(/[^a-z0-9-\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sanitizeTags(value, field) {
  if (value == null || value === "") return [];
  let tags = [];
  if (Array.isArray(value)) {
    tags = value;
  } else if (typeof value === "string") {
    tags = value.split(/[,;]+/);
  } else {
    throw createHttpError(400, `${field} alanı geçersiz.`);
  }

  const result = [];
  const seen = new Set();
  tags.forEach((tag, index) => {
    const normalized = ensureString(tag, `${field}[${index}]`, {
      required: true,
      maxLength: 60,
    });
    if (!normalized) return;
    if (seen.has(normalized.toLowerCase())) return;
    seen.add(normalized.toLowerCase());
    result.push(normalized);
  });
  return result;
}

function sanitizeExamples(value, field) {
  if (value == null || value === "") return [];
  let examples = [];
  if (Array.isArray(value)) {
    examples = value;
  } else if (typeof value === "string") {
    examples = value.split(/\n+/);
  } else {
    throw createHttpError(400, `${field} alanı geçersiz.`);
  }

  return examples
    .map((example, index) =>
      ensureString(example, `${field}[${index}]`, {
        required: true,
        maxLength: 400,
      })
    )
    .filter(Boolean);
}

function sanitizeDeckConfig(input, field, base = DEFAULT_DECKS) {
  const result = {
    learn: {
      ...base.learn,
    },
    review: {
      ...base.review,
    },
  };

  if (!input || typeof input !== "object") {
    return result;
  }

  if (input.learn && typeof input.learn === "object") {
    if ("isEnabled" in input.learn) {
      result.learn.isEnabled = ensureBoolean(
        input.learn.isEnabled,
        `${field}.learn.isEnabled`,
        {
          defaultValue: result.learn.isEnabled,
        }
      );
    }
    if ("initialIntervalDays" in input.learn) {
      result.learn.initialIntervalDays = ensureNumber(
        input.learn.initialIntervalDays,
        `${field}.learn.initialIntervalDays`,
        { min: 0 }
      );
    }
    if ("batchLimit" in input.learn) {
      result.learn.batchLimit = ensureNumber(
        input.learn.batchLimit,
        `${field}.learn.batchLimit`,
        { min: 1 }
      );
    }
  }

  if (input.review && typeof input.review === "object") {
    if ("isEnabled" in input.review) {
      result.review.isEnabled = ensureBoolean(
        input.review.isEnabled,
        `${field}.review.isEnabled`,
        {
          defaultValue: result.review.isEnabled,
        }
      );
    }
    if ("intervalModifier" in input.review) {
      result.review.intervalModifier = ensureNumber(
        input.review.intervalModifier,
        `${field}.review.intervalModifier`,
        { min: 0.1 }
      );
    }
    if ("maxIntervalDays" in input.review) {
      result.review.maxIntervalDays = ensureNumber(
        input.review.maxIntervalDays,
        `${field}.review.maxIntervalDays`,
        { min: 1 }
      );
    }
  }

  return result;
}

function sanitizeSpacedRepetition(input, field, base = DEFAULT_SPACED) {
  const result = { ...base };
  if (!input || typeof input !== "object") {
    return result;
  }

  if ("easeFactor" in input) {
    result.easeFactor = ensureNumber(input.easeFactor, `${field}.easeFactor`, {
      min: 0.5,
    });
  }
  if ("interval" in input) {
    result.interval = ensureNumber(input.interval, `${field}.interval`, {
      min: 0,
    });
  }
  if ("repetition" in input) {
    result.repetition = ensureNumber(input.repetition, `${field}.repetition`, {
      min: 0,
    });
  }

  return result;
}

function sanitizeCategory(input, field, { allowNull = true } = {}) {
  if (input == null || input === "") {
    if (allowNull) return null;
    throw createHttpError(400, `${field} alanı zorunludur.`);
  }

  let payload = input;
  if (typeof input === "string") {
    payload = { slug: input };
  }

  if (typeof payload !== "object") {
    throw createHttpError(400, `${field} alanı geçersiz.`);
  }

  const slugRaw = payload.slug ?? payload.id ?? payload.code ?? payload.name;
  const slug = slugify(slugRaw);
  if (!slug) {
    throw createHttpError(400, `${field}.slug alanı zorunludur.`);
  }

  const category = {
    slug,
  };

  if (payload.name != null) {
    category.name = ensureString(payload.name, `${field}.name`, {
      required: true,
      maxLength: 120,
    });
  }

  if (payload.description != null) {
    category.description = ensureString(
      payload.description,
      `${field}.description`,
      {
        required: false,
        maxLength: 600,
      }
    );
  }

  if (payload.level != null) {
    category.level = ensureEnum(payload.level, `${field}.level`, LEVELS, {
      required: false,
      defaultValue: null,
    });
  }

  if (payload.color != null) {
    const color = normalizeString(payload.color);
    if (!/^#?[0-9a-f]{3}([0-9a-f]{3})?$/i.test(color)) {
      throw createHttpError(400, `${field}.color değeri geçersiz.`);
    }
    category.color = color.startsWith("#") ? color : `#${color}`;
  }

  if (payload.isActive != null) {
    category.isActive = ensureBoolean(payload.isActive, `${field}.isActive`, {
      defaultValue: true,
    });
  }

  if (payload.parent != null) {
    category.parent = ensureString(payload.parent, `${field}.parent`, {
      required: false,
      maxLength: 120,
    });
  }

  return category;
}

function sanitizeSubcategories(input, field) {
  if (!input) return [];
  if (!Array.isArray(input)) {
    throw createHttpError(400, `${field} bir dizi olmalıdır.`);
  }
  return input.map((item, index) =>
    sanitizeCategory(item, `${field}[${index}]`, {
      allowNull: false,
    })
  );
}

function sanitizeDefaults(input = {}) {
  const defaults = {};
  defaults.language = (
    ensureString(input.language, "defaults.language", {
      required: false,
      maxLength: 10,
    }) || "en"
  ).toLowerCase();

  defaults.level = ensureEnum(input.level, "defaults.level", LEVELS, {
    required: false,
    defaultValue: null,
  });

  defaults.difficulty = ensureEnum(
    input.difficulty,
    "defaults.difficulty",
    DIFFICULTIES,
    { required: false, defaultValue: null }
  );

  defaults.status = ensureEnum(input.status, "defaults.status", STATUSES, {
    required: false,
    defaultValue: "draft",
  });

  defaults.tags = sanitizeTags(input.tags, "defaults.tags");

  defaults.category = input.category
    ? sanitizeCategory(input.category, "defaults.category", { allowNull: true })
    : null;

  defaults.decks = sanitizeDeckConfig(input.decks, "defaults.decks");
  defaults.spacedRepetition = sanitizeSpacedRepetition(
    input.spacedRepetition,
    "defaults.spacedRepetition"
  );

  return defaults;
}

function sanitizeWord(word, index, defaults) {
  if (!word || typeof word !== "object") {
    throw createHttpError(400, `words[${index}] öğesi geçersiz.`);
  }

  const fieldBase = `words[${index}]`;
  const sanitized = {};

  if (word.id || word._id) {
    sanitized.id = ensureString(word.id || word._id, `${fieldBase}.id`, {
      required: false,
      maxLength: 48,
    });
  }

  sanitized.term = ensureString(word.term || word.word, `${fieldBase}.term`, {
    required: true,
    maxLength: 160,
  });

  sanitized.translation = ensureString(
    word.translation ?? word.meaning ?? word.definitionTr,
    `${fieldBase}.translation`,
    { required: false, maxLength: 160 }
  );

  sanitized.definition = ensureString(
    word.definition,
    `${fieldBase}.definition`,
    {
      required: false,
      maxLength: 1000,
    }
  );

  sanitized.notes = ensureString(word.notes, `${fieldBase}.notes`, {
    required: false,
    maxLength: 600,
  });

  const language = ensureString(word.language, `${fieldBase}.language`, {
    required: false,
    maxLength: 10,
  });
  sanitized.language = (language || defaults.language || "en").toLowerCase();

  const examplesSource =
    word.examples || word.example || word.sampleSentences || word.sentences;
  sanitized.examples = sanitizeExamples(
    examplesSource,
    `${fieldBase}.examples`
  );

  const tags = sanitizeTags(word.tags ?? word.keywords, `${fieldBase}.tags`);
  const combinedTags = [...(defaults.tags || []), ...tags];
  const mergedTags = [];
  const seenTagKeys = new Set();
  for (const tag of combinedTags) {
    const normalized = tag.toLowerCase();
    if (seenTagKeys.has(normalized)) continue;
    seenTagKeys.add(normalized);
    mergedTags.push(tag);
  }
  sanitized.tags = mergedTags;

  const resolvedLevel = ensureEnum(
    word.level ?? word.cefrLevel,
    `${fieldBase}.level`,
    LEVELS,
    { required: false, defaultValue: defaults.level }
  );
  sanitized.level = resolvedLevel || defaults.level || "unknown";

  const resolvedDifficulty = ensureEnum(
    word.difficulty,
    `${fieldBase}.difficulty`,
    DIFFICULTIES,
    { required: false, defaultValue: defaults.difficulty }
  );
  sanitized.difficulty = resolvedDifficulty || defaults.difficulty || "easy";

  const resolvedStatus = ensureEnum(
    word.status,
    `${fieldBase}.status`,
    STATUSES,
    { required: false, defaultValue: defaults.status || "draft" }
  );
  sanitized.status = resolvedStatus || defaults.status || "draft";

  const categoryInput =
    word.category ?? word.categorySlug ?? word.categoryId ?? defaults.category;
  sanitized.category = categoryInput
    ? sanitizeCategory(categoryInput, `${fieldBase}.category`, {
        allowNull: true,
      })
    : null;

  sanitized.subcategories = sanitizeSubcategories(
    word.subcategories || word.tagsCategories,
    `${fieldBase}.subcategories`
  );

  const decksBase = defaults.decks || DEFAULT_DECKS;
  sanitized.decks = sanitizeDeckConfig(
    word.decks,
    `${fieldBase}.decks`,
    decksBase
  );

  const spacedBase = defaults.spacedRepetition || DEFAULT_SPACED;
  sanitized.spacedRepetition = sanitizeSpacedRepetition(
    word.spacedRepetition,
    `${fieldBase}.spacedRepetition`,
    spacedBase
  );

  return sanitized;
}

function validateVocabularyImportPayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw createHttpError(400, "JSON yapısı geçersiz.");
  }

  const defaultsInput = payload.defaults || payload.meta || {};
  const defaults = sanitizeDefaults(defaultsInput);

  const categoriesInput = Array.isArray(payload.categories)
    ? payload.categories
    : [];
  const categories = categoriesInput.map((category, index) =>
    sanitizeCategory(category, `categories[${index}]`, {
      allowNull: false,
    })
  );

  const wordsInput = Array.isArray(payload.words)
    ? payload.words
    : Array.isArray(payload.items)
    ? payload.items
    : null;

  if (!wordsInput || !wordsInput.length) {
    throw createHttpError(400, "En az bir kelime sağlamalısınız.");
  }

  const words = wordsInput.map((word, index) =>
    sanitizeWord(word, index, defaults)
  );

  return {
    defaults,
    categories,
    words,
  };
}

module.exports = {
  validateVocabularyImportPayload,
  LEVELS: Array.from(LEVELS),
  DIFFICULTIES: Array.from(DIFFICULTIES),
  STATUSES: Array.from(STATUSES),
  DEFAULT_DECKS,
  DEFAULT_SPACED,
};
