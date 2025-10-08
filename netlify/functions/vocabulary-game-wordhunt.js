const mongoose = require("mongoose");
const connectDB = require("./db");
const WordEntry = require("../../models/WordEntry");
const VocabularyCategory = require("../../models/VocabularyCategory");
const VocabularyGameSession = require("../../models/VocabularyGameSession");
const VocabularyProgress = require("../../models/VocabularyProgress");
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

const BOARD_SIZE = 6;
const MAX_WORDS = 8;
const DEFAULT_WORDS = 6;
const SCORE_PER_HIT = 10;
const MAX_LIVES = 3;
const SESSION_TTL_MS = 30 * 60 * 1000;

const TURKISH_ALPHABET = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ";

const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const sanitizeTranslation = (value) =>
  (value || "")
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-ZığüşöçİĞÜŞÖÇ]/g, "")
    .toLocaleUpperCase("tr-TR");

const ensureUser = async (event) => {
  const token = extractBearerToken(event);
  if (!token) throw createHttpError(401, "Authorization required");
  const decoded = verifyToken(token);
  if (!decoded?.sub) throw createHttpError(401, "Invalid token");
  const user = await User.findById(decoded.sub);
  if (!user) throw createHttpError(401, "User not found");
  return user;
};

const pickRandomOrientation = () =>
  Math.random() > 0.5 ? "horizontal" : "vertical";

const createEmptyBoard = (size) =>
  Array.from({ length: size }, () => Array(size).fill(null));

const canPlaceWord = (board, word, row, col, orientation) => {
  const size = board.length;
  if (orientation === "horizontal") {
    if (col + word.length > size) return false;
    for (let i = 0; i < word.length; i += 1) {
      const cell = board[row][col + i];
      if (cell && cell !== word[i]) return false;
    }
    return true;
  }
  if (row + word.length > size) return false;
  for (let i = 0; i < word.length; i += 1) {
    const cell = board[row + i][col];
    if (cell && cell !== word[i]) return false;
  }
  return true;
};

const placeWord = (board, word, wordId) => {
  const positions = [];
  const size = board.length;
  const maxAttempts = size * size;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const orientation = pickRandomOrientation();
    const row = randomInt(0, size - 1);
    const col = randomInt(0, size - 1);
    if (!canPlaceWord(board, word, row, col, orientation)) continue;

    for (let i = 0; i < word.length; i += 1) {
      const r = orientation === "horizontal" ? row : row + i;
      const c = orientation === "horizontal" ? col + i : col;
      board[r][c] = word[i];
      positions.push({ row: r, col: c });
    }

    return {
      id: wordId,
      orientation,
      positions,
    };
  }

  return null;
};

const fillBoard = (board) => {
  const size = board.length;
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (!board[row][col]) {
        const randomIndex = randomInt(0, TURKISH_ALPHABET.length - 1);
        board[row][col] = TURKISH_ALPHABET[randomIndex];
      }
    }
  }
  return board;
};

const fetchCategoryId = async (categoryParam) => {
  if (!categoryParam) return null;
  if (mongoose.Types.ObjectId.isValid(categoryParam)) {
    return new mongoose.Types.ObjectId(categoryParam);
  }
  const category = await VocabularyCategory.findOne({ slug: categoryParam });
  return category ? category._id : null;
};

const createWordHuntSession = async ({ user, words, board, placements }) => {
  const now = new Date();
  const session = new VocabularyGameSession({
    user: user._id,
    type: "word-hunt",
    startedAt: now,
    expiresAt: new Date(now.getTime() + SESSION_TTL_MS),
    payload: {
      board,
      words: words.map((word, index) => ({
        id: word._id.toString(),
        term: word.term,
        translation: word.translation,
        normalizedTranslation: sanitizeTranslation(word.translation),
        placement: placements[index],
      })),
      foundWordIds: [],
    },
    state: {
      status: "active",
      livesRemaining: MAX_LIVES,
      metadata: {
        scorePerHit: SCORE_PER_HIT,
        totalWords: words.length,
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

const serializeSession = (session, { includeSolutions = true } = {}) => {
  const payload = session.payload || {};
  const words = Array.isArray(payload.words) ? payload.words : [];
  return {
    sessionId: session._id.toString(),
    board: payload.board || [],
    words: words.map((word) => ({
      id: word.id,
      term: word.term,
      translation: includeSolutions ? word.translation : undefined,
      length: word.normalizedTranslation?.length || 0,
      positions: includeSolutions ? word.placement?.positions || [] : [],
      orientation: includeSolutions
        ? word.placement?.orientation || null
        : null,
    })),
    foundWordIds: payload.foundWordIds || [],
    state: session.state,
    result: session.result,
  };
};

const resolveWords = async ({ user, categoryId, limit }) => {
  const baseLimit = Math.max(2, Math.min(limit || DEFAULT_WORDS, MAX_WORDS));
  const progressWordIds = await VocabularyProgress.find({
    user: user._id,
  }).distinct("word");

  const filter = {
    owner: { $exists: false },
    status: "published",
    translation: { $exists: true, $ne: null, $ne: "" },
    _id: { $nin: progressWordIds },
  };

  if (categoryId) {
    filter.$or = [{ category: categoryId }, { subcategories: categoryId }];
  }

  const words = await WordEntry.find(filter)
    .sort({ difficulty: 1, term: 1 })
    .limit(baseLimit * 2)
    .lean();

  const selected = [];
  const usedIds = new Set();
  for (const word of words) {
    if (!word.translation) continue;
    if (usedIds.has(word._id.toString())) continue;
    const normalized = sanitizeTranslation(word.translation);
    if (normalized.length < 4 || normalized.length > BOARD_SIZE) continue;
    selected.push(word);
    usedIds.add(word._id.toString());
    if (selected.length >= baseLimit) break;
  }

  return selected;
};

const buildBoardWithWords = (words) => {
  const board = createEmptyBoard(BOARD_SIZE);
  const placements = [];

  for (const word of words) {
    const normalized = sanitizeTranslation(word.translation);
    const placement = placeWord(board, normalized, word._id.toString());
    if (!placement) {
      throw createHttpError(
        422,
        `Kelime yerleştirilemedi: ${word.translation || word.term}`
      );
    }
    placements.push({ ...placement, normalized });
  }

  fillBoard(board);
  return { board, placements };
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
      const limit = Number(params.limit) || DEFAULT_WORDS;

      const words = await resolveWords({ user, categoryId, limit });
      if (!words.length) {
        return respond(200, {
          session: null,
          message: "Uygun kelime bulunamadı",
        });
      }

      const { board, placements } = buildBoardWithWords(words);
      const session = await createWordHuntSession({
        user,
        words,
        board,
        placements,
      });

      const ensureResult = ensureVocabularyStats(user, {});
      if (ensureResult.modified) {
        user.markModified("vocabularyStats");
        await user.save();
      }

      return respond(200, {
        mode: "word-hunt",
        session: serializeSession(session),
        sessionMeta: buildSessionMeta(user.vocabularyStats || {}),
      });
    }

    const body = parseBody(event.body);
    const { sessionId, wordId, positions } = body;

    if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
      throw createHttpError(400, "Geçerli bir oturum kimliği gerekli");
    }

    const session = await VocabularyGameSession.findOne({
      _id: sessionId,
      user: user._id,
      type: "word-hunt",
    });

    if (!session) {
      throw createHttpError(404, "Oturum bulunamadı");
    }

    if (session.state?.status !== "active") {
      return respond(200, {
        mode: "word-hunt",
        session: serializeSession(session),
        completed: true,
      });
    }

    const payload = session.payload || {};
    const words = Array.isArray(payload.words) ? payload.words : [];
    const target = words.find((word) => word.id === wordId);

    if (!target) {
      throw createHttpError(404, "Kelime bulunamadı");
    }

    const foundWordIds = new Set(payload.foundWordIds || []);
    if (foundWordIds.has(target.id)) {
      return respond(200, {
        mode: "word-hunt",
        session: serializeSession(session),
        alreadyFound: true,
      });
    }

    const expectedPositions = (target.placement?.positions || []).map(
      (pos) => `${pos.row}:${pos.col}`
    );
    const submittedPositions = Array.isArray(positions)
      ? positions.map((pos) => `${Number(pos.row)}:${Number(pos.col)}`)
      : [];

    const isMatch =
      expectedPositions.length === submittedPositions.length &&
      expectedPositions.every(
        (value, index) => value === submittedPositions[index]
      );

    const now = new Date();
    let xpDelta = 0;

    if (isMatch) {
      foundWordIds.add(target.id);
      session.payload.foundWordIds = Array.from(foundWordIds);
      session.result.correct = (session.result.correct || 0) + 1;
      session.result.score = (session.result.score || 0) + SCORE_PER_HIT;
      session.result.combo = (session.result.combo || 0) + 1;
      session.result.maxCombo = Math.max(
        session.result.maxCombo || 0,
        session.result.combo || 0
      );
      session.state.metadata = {
        ...(session.state.metadata || {}),
        scorePerHit: SCORE_PER_HIT,
      };
      session.events.push({
        at: now,
        type: "correct",
        data: { wordId: target.id },
      });
      xpDelta = SCORE_PER_HIT / 2;
    } else {
      session.state.livesRemaining = Math.max(
        0,
        (session.state.livesRemaining || MAX_LIVES) - 1
      );
      session.result.incorrect = (session.result.incorrect || 0) + 1;
      session.result.combo = 0;
      session.events.push({
        at: now,
        type: "incorrect",
        data: { wordId: target.id, positions },
      });
    }

    const totalWords = session.state.metadata?.totalWords || words.length || 0;
    const allFound = foundWordIds.size >= totalWords;

    if (allFound || session.state.livesRemaining === 0) {
      session.state.status = "completed";
      session.completedAt = now;
      session.state.metadata = {
        ...(session.state.metadata || {}),
        finishedAt: now,
        success: allFound,
      };
      if (allFound) {
        xpDelta += SCORE_PER_HIT;
      }
    }

    session.result.xpEarned = (session.result.xpEarned || 0) + xpDelta;
    await session.save();

    if (xpDelta > 0 || !isMatch) {
      const result = recordGameResult(user, {
        now,
        xpDelta,
        comboDelta: session.result.combo || 0,
        successDelta: isMatch ? 1 : 0,
        failureDelta: isMatch ? 0 : 1,
      });
      if (result.modified) {
        user.markModified("vocabularyStats");
        await user.save();
      }
    }

    return respond(200, {
      mode: "word-hunt",
      success: isMatch,
      session: serializeSession(session),
      remainingLives: session.state.livesRemaining,
    });
  } catch (error) {
    return handleError(error, "vocabulary-game-wordhunt");
  }
};
