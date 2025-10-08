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

const ROUND_COUNT = 5;
const PLAYER_DAMAGE = 22;
const OPPONENT_DAMAGE = 18;
const XP_PER_VICTORY = 40;
const XP_PER_ROUND = 8;

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

const pickWords = async ({ user, categoryId, limit }) => {
  const progressFilter = {
    user: user._id,
    status: { $ne: "mastered" },
  };
  if (categoryId) progressFilter.category = categoryId;

  const progressWords = await VocabularyProgress.find(progressFilter)
    .populate({ path: "word", select: "term translation level category" })
    .limit(limit * 4)
    .lean();

  const selected = [];
  const used = new Set();
  for (const item of progressWords) {
    if (!item.word?.translation || used.has(item.word._id.toString())) continue;
    selected.push({
      id: item._id.toString(),
      term: item.word.term,
      translation: item.word.translation,
      wordId: item.word._id.toString(),
    });
    used.add(item.word._id.toString());
    if (selected.length >= limit) break;
  }

  if (selected.length >= limit) return selected;

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
  const fallback = await WordEntry.find(fallbackFilter)
    .sort({ difficulty: 1, term: 1 })
    .limit(limit * 3)
    .lean();

  for (const word of fallback) {
    if (!word.translation || used.has(word._id.toString())) continue;
    selected.push({
      id: word._id.toString(),
      term: word.term,
      translation: word.translation,
      wordId: word._id.toString(),
    });
    used.add(word._id.toString());
    if (selected.length >= limit) break;
  }

  return selected;
};

const shuffle = (array) => {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const buildRounds = ({ playerWords, opponentWords }) => {
  const rounds = [];
  const count = Math.min(playerWords.length, opponentWords.length, ROUND_COUNT);
  for (let i = 0; i < count; i += 1) {
    rounds.push({
      id: `${playerWords[i].id}:${opponentWords[i].id}`,
      player: playerWords[i],
      opponent: opponentWords[i],
    });
  }
  return rounds;
};

const createBattleSession = async ({ user, rounds }) => {
  const now = new Date();
  const session = new VocabularyGameSession({
    user: user._id,
    type: "flashcard-battle",
    startedAt: now,
    expiresAt: new Date(now.getTime() + 90 * 60 * 1000),
    payload: {
      rounds,
      answers: [],
      hp: {
        player: 100,
        opponent: 100,
      },
      currentRound: 0,
    },
    state: {
      status: "active",
      metadata: {
        totalRounds: rounds.length,
        playerHp: 100,
        opponentHp: 100,
      },
    },
    result: {
      correct: 0,
      incorrect: 0,
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
    rounds: payload.rounds || [],
    answers: payload.answers || [],
    hp: payload.hp || { player: 100, opponent: 100 },
    currentRound: payload.currentRound || 0,
    state: session.state,
    result: session.result,
  };
};

const normalizeAnswer = (value) =>
  (value || "").toString().trim().toLocaleLowerCase("tr-TR");

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
      const playerWords = shuffle(
        await pickWords({ user, categoryId, limit: ROUND_COUNT })
      );
      const opponentWords = shuffle(
        await pickWords({ user, categoryId: null, limit: ROUND_COUNT })
      );

      if (!playerWords.length || !opponentWords.length) {
        return respond(200, {
          mode: "flashcard-battle",
          session: null,
          message: "Yeterli kart bulunamadı",
        });
      }

      const rounds = buildRounds({ playerWords, opponentWords });
      const session = await createBattleSession({ user, rounds });
      const ensureResult = ensureVocabularyStats(user, {});
      if (ensureResult.modified) {
        user.markModified("vocabularyStats");
        await user.save();
      }

      return respond(200, {
        mode: "flashcard-battle",
        session: serializeSession(session),
        sessionMeta: buildSessionMeta(user.vocabularyStats || {}),
      });
    }

    const body = parseBody(event.body);
    const { sessionId, roundId, answer } = body;

    if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
      throw createHttpError(400, "Geçerli bir oturum kimliği gerekli");
    }

    const session = await VocabularyGameSession.findOne({
      _id: sessionId,
      user: user._id,
      type: "flashcard-battle",
    });

    if (!session) throw createHttpError(404, "Oturum bulunamadı");

    if (session.state?.status !== "active") {
      return respond(200, {
        mode: "flashcard-battle",
        session: serializeSession(session),
        completed: true,
      });
    }

    const payload = session.payload || {};
    const rounds = Array.isArray(payload.rounds) ? payload.rounds : [];
    const targetRound = rounds.find((round) => round.id === roundId);

    if (!targetRound) {
      throw createHttpError(404, "Round bulunamadı");
    }

    const answers = Array.isArray(payload.answers) ? payload.answers : [];
    if (answers.some((entry) => entry.roundId === roundId)) {
      return respond(200, {
        mode: "flashcard-battle",
        session: serializeSession(session),
        alreadyAnswered: true,
      });
    }

    const normalizedExpected = normalizeAnswer(targetRound.player.translation);
    const normalizedAnswer = normalizeAnswer(answer);
    const isCorrect = normalizedExpected === normalizedAnswer;

    const hp = payload.hp || { player: 100, opponent: 100 };
    const now = new Date();

    if (isCorrect) {
      hp.opponent = Math.max(0, (hp.opponent || 100) - PLAYER_DAMAGE);
      session.result.correct = (session.result.correct || 0) + 1;
      session.result.score = (session.result.score || 0) + PLAYER_DAMAGE;
      session.result.combo = (session.result.combo || 0) + 1;
      session.result.maxCombo = Math.max(
        session.result.maxCombo || 0,
        session.result.combo || 0
      );
      session.result.xpEarned = (session.result.xpEarned || 0) + XP_PER_ROUND;
    } else {
      hp.player = Math.max(0, (hp.player || 100) - OPPONENT_DAMAGE);
      session.result.incorrect = (session.result.incorrect || 0) + 1;
      session.result.combo = 0;
    }

    answers.push({
      roundId,
      answer,
      isCorrect,
      at: now,
    });

    session.payload.answers = answers;
    session.payload.hp = hp;
    session.payload.currentRound = answers.length;

    session.events.push({
      at: now,
      type: isCorrect ? "player-hit" : "opponent-hit",
      data: {
        roundId,
        answer,
      },
    });

    const allRoundsAnswered = answers.length >= rounds.length;
    const playerDefeated = hp.player <= 0;
    const opponentDefeated = hp.opponent <= 0;
    let bonusXp = 0;

    if (allRoundsAnswered || playerDefeated || opponentDefeated) {
      session.state.status = "completed";
      session.completedAt = now;
      session.state.metadata = {
        ...(session.state.metadata || {}),
        playerHp: hp.player,
        opponentHp: hp.opponent,
        finishedAt: now,
        victory: opponentDefeated && hp.player > 0,
      };
      if (opponentDefeated && hp.player > 0) {
        session.result.xpEarned =
          (session.result.xpEarned || 0) + XP_PER_VICTORY;
        bonusXp = XP_PER_VICTORY;
      }
    }

    await session.save();

    const xpDelta = (isCorrect ? XP_PER_ROUND : 0) + bonusXp;
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

    return respond(200, {
      mode: "flashcard-battle",
      success: isCorrect,
      session: serializeSession(session),
    });
  } catch (error) {
    return handleError(error, "vocabulary-flashcard-battle");
  }
};
