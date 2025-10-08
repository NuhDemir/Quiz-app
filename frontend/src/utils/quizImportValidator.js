import levels from "../data/levels.json";

const LEVELS = new Set(levels.map((level) => String(level.id || level.value || level.name || level.code).toUpperCase()));
const DIFFICULTIES = new Set(["easy", "medium", "hard"]);

export const QUIZ_IMPORT_TEMPLATE = {
  quiz: {
    title: "Verb Tenses Practice",
    slug: "verb-tenses-practice",
    description: "Master the most common English verb tenses with focused practice.",
    category: "grammar",
    level: "B1",
    difficulty: "medium",
    tags: ["verb", "tenses", "grammar"],
    timeLimitSec: 900,
    isPublished: false,
  },
  questions: [
    {
      prompt: "Which tense best completes the sentence? 'She ____ to the gym every morning.'",
      options: ["go", "goes", "is going", "has gone"],
      correctAnswer: "goes",
      explanation: "For routines we use the present simple tense.",
      hint: "Think about habitual actions.",
      points: 10,
      media: {
        type: "image",
        url: "https://example.com/gym.jpg",
        caption: "Morning gym routine",
      },
      tags: ["present simple"],
    },
  ],
};

function createError(message, path) {
  const error = new Error(message);
  if (path) {
    error.path = path;
    error.message = `${message} (Alan: ${path})`;
  }
  return error;
}

function normalizeString(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function ensureString(value, { field, required = false, maxLength, normalizeFn } = {}) {
  let normalized = value;
  if (normalizeFn) {
    normalized = normalizeFn(value);
  } else {
    normalized = normalizeString(value);
  }
  if (required && !normalized) {
    throw createError(`${field} zorunludur.`, field);
  }
  if (maxLength && normalized.length > maxLength) {
    throw createError(`${field} en fazla ${maxLength} karakter olabilir.`, field);
  }
  return normalized;
}

function ensureBoolean(value, { field, defaultValue = false } = {}) {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  if (value == null) return defaultValue;
  throw createError(`${field} değeri geçersiz.`, field);
}

function ensureNumber(value, { field, min, max, allowNull = false } = {}) {
  if (value == null || value === "") {
    if (allowNull) return null;
    throw createError(`${field} zorunludur.`, field);
  }
  const num = Number(value);
  if (Number.isNaN(num)) {
    throw createError(`${field} sayısal olmalıdır.`, field);
  }
  if (min != null && num < min) {
    throw createError(`${field} en az ${min} olabilir.`, field);
  }
  if (max != null && num > max) {
    throw createError(`${field} en fazla ${max} olabilir.`, field);
  }
  return num;
}

function ensureEnum(value, { field, allowed, required = false, transform = (v) => v } = {}) {
  if (value == null || value === "") {
    if (required) {
      throw createError(`${field} zorunludur.`, field);
    }
    return null;
  }
  const normalized = normalizeString(value);
  if (!normalized) {
    if (required) {
      throw createError(`${field} zorunludur.`, field);
    }
    return null;
  }
  for (const option of allowed) {
    if (option.toLowerCase() === normalized.toLowerCase()) {
      return transform(option);
    }
  }
  throw createError(`${field} değeri desteklenmiyor: ${value}`, field);
}

function sanitizeSlug(value) {
  return normalizeString(value)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ensureTags(value, { field } = {}) {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value
      .map((tag, index) =>
        ensureString(tag, {
          field: `${field}[${index}]`,
          required: true,
          maxLength: 50,
        })
      )
      .filter(Boolean);
  }
  const normalized = normalizeString(value);
  if (!normalized) return [];
  return normalized
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function ensureOptions(value, { questionIndex }) {
  const field = `questions[${questionIndex}].options`;
  if (!Array.isArray(value) || value.length < 2) {
    throw createError(`En az iki seçenek sağlamalısınız.`, field);
  }
  const options = value.map((option, idx) => {
    if (typeof option === "object" && option && "value" in option) {
      return ensureString(option.value, {
        field: `${field}[${idx}]`,
        required: true,
        maxLength: 200,
      });
    }
    return ensureString(option, {
      field: `${field}[${idx}]`,
      required: true,
      maxLength: 200,
    });
  });
  return options;
}

function ensureCorrectAnswer(value, { options, questionIndex }) {
  const field = `questions[${questionIndex}].correctAnswer`;
  if (Array.isArray(value)) {
    if (value.length !== 1) {
      throw createError(
        "Şimdilik yalnızca tek bir doğru cevap destekleniyor. Diziden ilk öğeyi seçin.",
        field
      );
    }
    value = value[0];
  }
  const normalized = ensureString(value, { field, required: true, maxLength: 200 });
  if (!options.includes(normalized)) {
    throw createError("Doğru cevap seçenekler arasında yer almalıdır.", field);
  }
  return normalized;
}

function ensureMedia(value, { field }) {
  if (!value) return undefined;
  if (typeof value === "string") {
    return {
      type: "image",
      url: normalizeString(value),
    };
  }
  if (typeof value !== "object") {
    throw createError("Medya alanı geçersiz.", field);
  }
  const type = value.type ? normalizeString(value.type) : "image";
  const url = ensureString(value.url, {
    field: `${field}.url`,
    required: true,
    maxLength: 500,
  });
  const caption = value.caption
    ? ensureString(value.caption, {
        field: `${field}.caption`,
        required: false,
        maxLength: 140,
      })
    : undefined;
  const credit = value.credit
    ? ensureString(value.credit, {
        field: `${field}.credit`,
        required: false,
        maxLength: 140,
      })
    : undefined;
  return {
    type: type || "image",
    url,
    caption: caption || undefined,
    credit: credit || undefined,
  };
}

function normalizeLevel(value, field) {
  const level = ensureEnum(value, {
    field,
    allowed: LEVELS,
    required: true,
    transform: (option) => option.toUpperCase(),
  });
  return level;
}

export function validateQuizImport(rawInput) {
  if (!rawInput || typeof rawInput !== "object") {
    throw createError("JSON yapısı geçersiz.", "root");
  }

  const quizSection = rawInput.quiz || rawInput.meta || rawInput.details;
  if (!quizSection || typeof quizSection !== "object") {
    throw createError("'quiz' alanı bulunamadı.", "quiz");
  }

  const quiz = {};

  quiz.title = ensureString(quizSection.title, {
    field: "quiz.title",
    required: true,
    maxLength: 140,
  });
  quiz.slug = sanitizeSlug(
    ensureString(quizSection.slug || quizSection.title, {
      field: "quiz.slug",
      required: true,
      maxLength: 140,
    })
  );
  if (!quiz.slug) {
    throw createError("Slug üretilemedi, lütfen elle belirtin.", "quiz.slug");
  }
  quiz.description = ensureString(quizSection.description, {
    field: "quiz.description",
    required: false,
    maxLength: 600,
  }) || undefined;
  quiz.category = ensureString(quizSection.category, {
    field: "quiz.category",
    required: true,
    maxLength: 100,
  }).toLowerCase();
  const levelField = quizSection.level || quizSection.cefrLevel;
  quiz.level = normalizeLevel(levelField, "quiz.level");
  const difficultyField = ensureEnum(quizSection.difficulty, {
    field: "quiz.difficulty",
    allowed: DIFFICULTIES,
    required: true,
  });
  quiz.difficulty = difficultyField;
  const timeLimit = quizSection.timeLimitSec ?? quizSection.timeLimit;
  quiz.timeLimitSec = ensureNumber(timeLimit ?? 600, {
    field: "quiz.timeLimitSec",
    min: 30,
    max: 7200,
  });
  quiz.isPublished = ensureBoolean(quizSection.isPublished, {
    field: "quiz.isPublished",
    defaultValue: false,
  });
  quiz.tags = ensureTags(quizSection.tags, { field: "quiz.tags" });

  const questionsRaw = Array.isArray(rawInput.questions)
    ? rawInput.questions
    : Array.isArray(rawInput.items)
    ? rawInput.items
    : [];
  if (!Array.isArray(questionsRaw) || questionsRaw.length === 0) {
    throw createError("En az bir soru sağlamalısınız.", "questions");
  }

  const questions = questionsRaw.map((questionInput, index) => {
    const fieldBase = `questions[${index}]`;
    if (!questionInput || typeof questionInput !== "object") {
      throw createError("Soru nesnesi geçersiz.", fieldBase);
    }
    const prompt = questionInput.prompt ?? questionInput.text;
    const text = ensureString(prompt, {
      field: `${fieldBase}.prompt`,
      required: true,
      maxLength: 500,
    });
    const explanation = ensureString(questionInput.explanation, {
      field: `${fieldBase}.explanation`,
      required: false,
      maxLength: 500,
    });
    const hint = ensureString(questionInput.hint, {
      field: `${fieldBase}.hint`,
      required: false,
      maxLength: 280,
    });
    const options = ensureOptions(questionInput.options || questionInput.choices, {
      questionIndex: index,
    });
    const correctSource =
      questionInput.correctAnswer ??
      questionInput.answer ??
      questionInput.correct ??
      questionInput.correctAnswers;
    const correctAnswer = ensureCorrectAnswer(correctSource, {
      options,
      questionIndex: index,
    });
    const tags = ensureTags(questionInput.tags, { field: `${fieldBase}.tags` });
    const levelOverride = questionInput.level || questionInput.cefrLevel;
    const level = levelOverride
      ? normalizeLevel(levelOverride, `${fieldBase}.level`)
      : null;
    const difficultyOverride = ensureEnum(questionInput.difficulty, {
      field: `${fieldBase}.difficulty`,
      allowed: DIFFICULTIES,
      required: false,
    });
    const points = questionInput.points ?? questionInput.score;
    const sanitizedPoints = points != null
      ? ensureNumber(points, {
          field: `${fieldBase}.points`,
          min: 0,
          max: 1000,
          allowNull: true,
        })
      : undefined;
    const media = ensureMedia(questionInput.media, { field: `${fieldBase}.media` });

    return {
      text,
      explanation: explanation || undefined,
      hint: hint || undefined,
      options,
      correctAnswer,
      tags,
      level: level || undefined,
      difficulty: difficultyOverride || undefined,
      points: sanitizedPoints != null ? sanitizedPoints : undefined,
      media,
    };
  });

  return {
    quiz,
    questions,
  };
}

export function getQuizImportTemplateString() {
  return `${JSON.stringify(QUIZ_IMPORT_TEMPLATE, null, 2)}\n`;
}
