const mongoose = require("mongoose");
const connectDB = require("./db");
const WordEntry = require("../../models/WordEntry");
const VocabularyCategory = require("../../models/VocabularyCategory");
const VocabularyProgress = require("../../models/VocabularyProgress");
const VocabularyGameSession = require("../../models/VocabularyGameSession");
const User = require("../../models/User");
const {
  extractBearerToken,
  verifyToken,
  respond,
  parseBody,
  createHttpError,
  handleError,
} = require("./auth-helpers");
const {
  ensureVocabularyStats,
  buildSessionMeta,
  recordGameResult,
} = require("./lib/vocabulary-stats");

const DEFAULT_CARD_COUNT = 12;
const MAX_CARD_COUNT = 25;
const SESSION_DURATION_MS = 30 * 1000;
const SCORE_PER_CORRECT = 15;
const XP_PER_CORRECT = 6;

const ensureUser = async (event) => {
  const token = extractBearerToken(event);
  if (!token) throw createHttpError(401, "Authorization required");
  const decoded = verifyToken(token);
  const user = await User.findById(decoded.sub);
  if (!user) throw createHttpError(401, "User not found");
  return user;
};

const fetchCategoryId = async (categoryParam) => {
  if (!categoryParam) return null;
  if (mongoose.Types.ObjectId.isValid(categoryParam)) {
    return new mongoose.Types.ObjectId(categoryParam);
  }
  const category = await VocabularyCategory.findOne({ slug: categoryParam });
  return category ? category._id : null;
};

const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const shuffle = (array) => {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const selectCards = async ({ user, categoryId, limit }) => {
  const effectiveLimit = Math.min(
    Math.max(limit || DEFAULT_CARD_COUNT, 5),
    MAX_CARD_COUNT
  );
  const dueFilter = {
    user: user._id,
    status: { $ne: "mastered" },
    $or: [
      { nextReviewAt: { $lte: new Date() } },
      { nextReviewAt: { $exists: false } },
    ],
  };
  if (categoryId) {
    dueFilter.category = categoryId;
  }

  const dueProgress = await VocabularyProgress.find(dueFilter)
    .populate({
      path: "word",
      populate: { path: "category", select: "name slug" },
    })
    .limit(effectiveLimit * 2)
    .lean();

  const cards = [];
  const usedIds = new Set();

  for (const item of dueProgress) {
    if (!item?.word?.translation || usedIds.has(item.word._id.toString())) {
      continue;
    }
    cards.push({
      id: item._id.toString(),
      wordId: item.word._id.toString(),
      term: item.word.term,
      translation: item.word.translation,
      level: item.word.level,
      category: item.word.category,
    });
    usedIds.add(item.word._id.toString());
    if (cards.length >= effectiveLimit) break;
  }

  if (cards.length >= effectiveLimit) {
    return cards;
  }

  const pullLimit = effectiveLimit - cards.length;
  const fallbackFilter = {
    owner: { $exists: false },
    status: "published",
    translation: { $exists: true, $ne: null, $ne: "" },
  };
  if (categoryId) {
    fallbackFilter.$or = [
      { category: categoryId },
      { subcategories: categoryId },
    ];
  }

  const fallbackWords = await WordEntry.find(fallbackFilter)
    .sort({ difficulty: 1, term: 1 })
    .limit(pullLimit * 3)
    .lean();

  for (const word of fallbackWords) {
    if (!word.translation || usedIds.has(word._id.toString())) continue;
    cards.push({
      id: word._id.toString(),
      wordId: word._id.toString(),
      term: word.term,
      translation: word.translation,
      level: word.level,
      category: word.category,
    });
    usedIds.add(word._id.toString());
    if (cards.length >= effectiveLimit) break;
  }

  return cards;
};

const buildOptions = (cards) => {
  const translationPool = cards.map((card) => card.translation);
  return cards.map((card) => {
    const options = new Set([card.translation]);
    while (options.size < 4 && options.size < translationPool.length) {
      const candidate =
        translationPool[randomInt(0, translationPool.length - 1)];
      if (candidate) options.add(candidate);
    }
    const filled = Array.from(options);
    while (filled.length < 4) {
      filled.push(`${card.translation}-${filled.length}`);
    }
    const shuffled = shuffle(filled);
    return {
      ...card,
      options: shuffled,
    };
  });
};

const createSpeedSession = async ({ user, cards }) => {
  const now = new Date();
  const session = new VocabularyGameSession({
    user: user._id,
    type: "speed-challenge",
    startedAt: now,
    expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
    payload: {
      cards,
      answered: [],
      durationMs: SESSION_DURATION_MS,
    },
    state: {
      status: "active",
      metadata: {
        durationMs: SESSION_DURATION_MS,
        totalCards: cards.length,
      },
    },
    result: {
      correct: 0,
      incorrect: 0,
      skipped: 0,
      score: 0,
      combo: 0,
      maxCombo: 0,
      xpEarned: 0,
    },
    events: [],
  });

  await session.save();
  return session;
};

const serializeSession = (session) => {
  const payload = session.payload || {};
  return {
    sessionId: session._id.toString(),
    cards: payload.cards || [],
    answered: payload.answered || [],
    durationMs: payload.durationMs || SESSION_DURATION_MS,
    state: session.state,
    result: session.result,
  };
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return respond(204, {});
  if (!["GET", "POST"].includes(event.httpMethod)) {
    return respond(405, { error: "Method Not Allowed" });
  }

  try {
    await connectDB();
    const user = await ensureUser(event);

    if (event.httpMethod === "GET") {
      const params = event.queryStringParameters || {};
      const categoryId = await fetchCategoryId(params.category);
      const limit = Number(params.limit) || DEFAULT_CARD_COUNT;
      const cards = await selectCards({ user, categoryId, limit });

      if (!cards.length) {
        return respond(200, {
          mode: "speed-challenge",
          session: null,
          message: "Yeterli kelime bulunamadı",
        });
      }

      const session = await createSpeedSession({
        user,
        cards: buildOptions(cards),
      });

      const ensureResult = ensureVocabularyStats(user, {});
      if (ensureResult.modified) {
        user.markModified("vocabularyStats");
        await user.save();
      }

      return respond(200, {
        mode: "speed-challenge",
        session: serializeSession(session),
        sessionMeta: buildSessionMeta(user.vocabularyStats || {}),
      });
    }

    const body = parseBody(event.body);
    const { sessionId, cardId, answer, finish, elapsedMs } = body;

    if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
      throw createHttpError(400, "Geçerli oturum kimliği gerekli");
    }

    const session = await VocabularyGameSession.findOne({
      _id: sessionId,
      user: user._id,
      type: "speed-challenge",
    });

    if (!session) throw createHttpError(404, "Oturum bulunamadı");

    if (session.state?.status !== "active" && !finish) {
      return respond(200, {
        mode: "speed-challenge",
        session: serializeSession(session),
        completed: true,
      });
    }

    const payload = session.payload || {};
    const answered = Array.isArray(payload.answered) ? payload.answered : [];
    const cards = Array.isArray(payload.cards) ? payload.cards : [];
    const card = cards.find((item) => item.id === cardId);

    if (finish) {
      session.state = {
        ...(session.state || {}),
        status: "completed",
        metadata: {
          ...(session.state?.metadata || {}),
          finishedAt: new Date(),
          elapsedMs: Number(elapsedMs) || null,
        },
      };
      session.completedAt = new Date();
      session.events.push({
        at: new Date(),
        type: "finish",
        data: {
          elapsedMs,
        },
      });
      session.result.xpEarned = session.result.correct * XP_PER_CORRECT;
      await session.save();

      if (session.result.xpEarned > 0) {
        const result = recordGameResult(user, {
          xpDelta: session.result.xpEarned,
          comboDelta: session.result.combo || 0,
          successDelta: session.result.correct || 0,
          failureDelta: session.result.incorrect || 0,
        });
        if (result.modified) {
          user.markModified("vocabularyStats");
          await user.save();
        }
      }

      return respond(200, {
        mode: "speed-challenge",
        session: serializeSession(session),
        completed: true,
      });
    }

    if (!card) {
      throw createHttpError(404, "Kart bulunamadı");
    }

    if (answered.some((entry) => entry.cardId === card.id)) {
      return respond(200, {
        mode: "speed-challenge",
        session: serializeSession(session),
        alreadyAnswered: true,
      });
    }

    const isCorrect = card.translation === answer;
    const now = new Date();
    answered.push({
      cardId: card.id,
      answer,
      isCorrect,
      at: now,
    });
    session.payload.answered = answered;

    if (isCorrect) {
      session.result.correct = (session.result.correct || 0) + 1;
      session.result.score = (session.result.score || 0) + SCORE_PER_CORRECT;
      session.result.combo = (session.result.combo || 0) + 1;
      session.result.maxCombo = Math.max(
        session.result.maxCombo || 0,
        session.result.combo || 0
      );
      session.result.xpEarned = (session.result.xpEarned || 0) + XP_PER_CORRECT;
    } else {
      session.result.incorrect = (session.result.incorrect || 0) + 1;
      session.result.combo = 0;
    }

    session.events.push({
      at: now,
      type: isCorrect ? "correct" : "incorrect",
      data: {
        cardId: card.id,
        answer,
      },
    });

    await session.save();

    const xpDelta = isCorrect ? XP_PER_CORRECT : 0;
    const result = recordGameResult(user, {
      xpDelta,
      comboDelta: session.result.combo || 0,
      successDelta: isCorrect ? 1 : 0,
      failureDelta: isCorrect ? 0 : 1,
    });
    if (result.modified) {
      user.markModified("vocabularyStats");
      await user.save();
    }

    const remaining = cards.length - answered.length;

    return respond(200, {
      mode: "speed-challenge",
      success: isCorrect,
      remaining,
      session: serializeSession(session),
    });
  } catch (error) {
    return handleError(error, "vocabulary-speed-challenge");
  }
};
