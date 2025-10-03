const { createHttpError } = require("../auth-helpers");

const LEVELS = new Set(["A1", "A2", "B1", "B2", "C1", "C2", "mixed"]);
const DIFFICULTIES = new Set(["easy", "medium", "hard"]);

function normalizeString(input) {
  if (typeof input !== "string") {
    return "";
  }
  return input.trim();
}

function ensureString(value, field, { required = false, maxLength } = {}) {
  const normalized = normalizeString(value);
  if (required && !normalized) {
    throw createHttpError(400, `${field} alanı zorunludur.`);
  }
  if (maxLength && normalized.length > maxLength) {
    throw createHttpError(
      400,
      `${field} en fazla ${maxLength} karakter olabilir.`
    );
  }
  return normalized;
}

function ensureBoolean(value, field) {
  if (typeof value === "boolean") {
    return value;
  }
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  if (value == null) return false;
  throw createHttpError(400, `${field} alanı geçersiz.`);
}

function ensureNumber(value, field, { min, max } = {}) {
  if (value == null || value === "") {
    return null;
  }
  const num = Number(value);
  if (Number.isNaN(num)) {
    throw createHttpError(400, `${field} sayısal olmalıdır.`);
  }
  if (min != null && num < min) {
    throw createHttpError(400, `${field} en az ${min} olmalıdır.`);
  }
  if (max != null && num > max) {
    throw createHttpError(400, `${field} en fazla ${max} olabilir.`);
  }
  return num;
}

function ensureEnum(value, field, allowedSet, { required = false } = {}) {
  if (value == null) {
    if (required) {
      throw createHttpError(400, `${field} alanı zorunludur.`);
    }
    return null;
  }
  const normalized = normalizeString(value).toLowerCase();
  for (const option of allowedSet) {
    if (option.toLowerCase() === normalized) {
      return option;
    }
  }
  throw createHttpError(400, `${field} değeri geçersiz.`);
}

function validateQuestion(question, index) {
  if (typeof question !== "object" || !question) {
    throw createHttpError(
      400,
      `Sorular dizisindeki ${index + 1}. öğe geçersiz.`
    );
  }

  const questionIdRaw = question.id || question._id;
  const questionId = questionIdRaw ? normalizeString(questionIdRaw) : null;

  const text = ensureString(question.text, "Soru metni", {
    required: true,
    maxLength: 500,
  });
  const explanation = ensureString(question.explanation, "Açıklama", {
    required: false,
    maxLength: 500,
  });
  const optionsRaw = Array.isArray(question.options)
    ? question.options
    : Array.isArray(question.answers)
    ? question.answers
    : [];
  if (!Array.isArray(optionsRaw) || optionsRaw.length < 2) {
    throw createHttpError(
      400,
      `Soru (${index + 1}) en az iki seçenek içermelidir.`
    );
  }
  const options = optionsRaw.map((opt, optIndex) =>
    ensureString(opt, `Soru (${index + 1}) seçeneği #${optIndex + 1}`, {
      required: true,
      maxLength: 200,
    })
  );

  const correctAnswer = ensureString(
    question.correctAnswer,
    `Soru (${index + 1}) doğru cevap`,
    {
      required: true,
      maxLength: 200,
    }
  );

  if (!options.includes(correctAnswer)) {
    throw createHttpError(
      400,
      `Soru (${
        index + 1
      }) için belirtilen doğru cevap seçeneklerde bulunmalıdır.`
    );
  }

  const tags = Array.isArray(question.tags)
    ? question.tags.map((tag, tagIdx) =>
        ensureString(tag, `Soru (${index + 1}) etiketi #${tagIdx + 1}`, {
          required: true,
          maxLength: 50,
        })
      )
    : [];

  const level = question.level
    ? ensureEnum(question.level, `Soru (${index + 1}) seviyesi`, LEVELS)
    : null;
  const difficulty = question.difficulty
    ? ensureEnum(
        question.difficulty,
        `Soru (${index + 1}) zorluk`,
        DIFFICULTIES
      )
    : null;

  return {
    id: questionId || undefined,
    text,
    explanation: explanation || undefined,
    options,
    correctAnswer,
    tags,
    level,
    difficulty,
  };
}

function validateQuizPayload(payload, { partial = false } = {}) {
  if (!payload || typeof payload !== "object") {
    throw createHttpError(400, "Geçersiz istek gövdesi");
  }

  const result = {};

  if (!partial || payload.title != null) {
    result.title = ensureString(payload.title, "Başlık", {
      required: !partial,
      maxLength: 140,
    });
  }

  if (!partial || payload.slug != null) {
    const slug = ensureString(payload.slug, "Slug", {
      required: !partial,
      maxLength: 140,
    })
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (!slug && !partial) {
      throw createHttpError(400, "Slug alanı zorunludur.");
    }
    if (slug) {
      result.slug = slug;
    }
  }

  if (!partial || payload.description != null) {
    const description = ensureString(payload.description, "Açıklama", {
      required: false,
      maxLength: 600,
    });
    if (description) {
      result.description = description;
    }
  }

  if (!partial || payload.category != null) {
    result.category = ensureString(payload.category, "Kategori", {
      required: !partial,
      maxLength: 100,
    }).toLowerCase();
  }

  if (!partial || payload.level != null) {
    const level = ensureEnum(payload.level, "Seviye", LEVELS, {
      required: !partial,
    });
    if (level) {
      result.level = level;
    }
  }

  if (!partial || payload.difficulty != null) {
    const difficulty = ensureEnum(payload.difficulty, "Zorluk", DIFFICULTIES, {
      required: !partial,
    });
    if (difficulty) {
      result.difficulty = difficulty;
    }
  }

  if (!partial || payload.timeLimitSec != null) {
    const timeLimit = ensureNumber(payload.timeLimitSec, "Süre (sn)", {
      min: 30,
      max: 7200,
    });
    if (timeLimit != null) {
      result.timeLimitSec = Math.round(timeLimit);
    }
  }

  if (!partial || payload.isPublished != null) {
    result.isPublished = ensureBoolean(payload.isPublished, "Yayın durumu");
  }

  if (!partial || payload.tags != null) {
    if (payload.tags == null) {
      result.tags = [];
    } else if (!Array.isArray(payload.tags)) {
      throw createHttpError(400, "Etiketler dizisi geçersiz.");
    } else {
      result.tags = payload.tags.map((tag, idx) =>
        ensureString(tag, `Etiket #${idx + 1}`, {
          required: true,
          maxLength: 40,
        })
      );
    }
  }

  if (payload.questions != null) {
    if (!Array.isArray(payload.questions) || !payload.questions.length) {
      throw createHttpError(400, "Quiz en az bir soru içermelidir.");
    }
    result.questions = payload.questions.map((question, idx) =>
      validateQuestion(question, idx)
    );
  }

  return result;
}

function validateListQuery(params = {}) {
  const filters = {};
  if (params.category) {
    filters.category = ensureString(params.category, "Kategori", {
      required: false,
      maxLength: 100,
    }).toLowerCase();
  }
  if (params.level) {
    filters.level = ensureEnum(params.level, "Seviye", LEVELS);
  }
  if (params.difficulty) {
    filters.difficulty = ensureEnum(params.difficulty, "Zorluk", DIFFICULTIES);
  }
  if (params.search) {
    filters.search = ensureString(params.search, "Arama", {
      required: false,
      maxLength: 140,
    });
  }
  return filters;
}

module.exports = {
  validateQuizPayload,
  validateListQuery,
  LEVELS: Array.from(LEVELS),
  DIFFICULTIES: Array.from(DIFFICULTIES),
};
