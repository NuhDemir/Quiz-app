const mongoose = require("mongoose");
const connectDB = require("./db");
const WordEntry = require("../../models/WordEntry");
const VocabularyCategory = require("../../models/VocabularyCategory");
const VocabularyProgress = require("../../models/VocabularyProgress");
const User = require("../../models/User");
const DailyUserStat = require("../../models/DailyUserStat");
const ReviewLog = require("../../models/ReviewLog");
const {
  extractBearerToken,
  verifyToken,
  parseBody,
  respond,
  handleError,
  createHttpError,
} = require("./auth-helpers");

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 40;
const XP_REWARD = {
  success: 10,
  failure: 2,
  skipped: 0,
};
const SESSION_TIMEOUT_MS = 45 * 60 * 1000;

const toDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const resolveDailyGoal = (user) => {
  const settings = user.settings || {};
  const candidates = [
    settings.dailyVocabularyTarget,
    settings.vocabularyDailyGoal,
    settings.vocabularyDailyTarget,
  ];
  const goal = candidates.find(
    (value) => Number.isFinite(Number(value)) && Number(value) > 0
  );
  return goal ? Number(goal) : 10;
};

const hasSessionExpired = (session, now, todayKey) => {
  if (!session) return true;
  const lastActivity = session.lastActivityAt
    ? new Date(session.lastActivityAt)
    : null;
  if (!lastActivity || Number.isNaN(lastActivity.getTime())) return true;
  if (now.getTime() - lastActivity.getTime() > SESSION_TIMEOUT_MS) return true;
  if (session.startedAt) {
    const startedAt = new Date(session.startedAt);
    if (
      !Number.isNaN(startedAt.getTime()) &&
      toDateKey(startedAt) !== todayKey
    ) {
      return true;
    }
  }
  return false;
};

const ensureVocabularyStats = (
  user,
  { now = new Date(), resetSession = false } = {}
) => {
  if (!user.vocabularyStats) {
    user.vocabularyStats = {};
  }

  const stats = user.vocabularyStats;
  let modified = false;
  let sessionReset = false;

  const ensureNumber = (key) => {
    if (!Number.isFinite(stats[key])) {
      stats[key] = 0;
      modified = true;
    }
  };

  ensureNumber("xp");
  ensureNumber("streak");
  ensureNumber("longestStreak");
  ensureNumber("combo");
  ensureNumber("maxCombo");
  ensureNumber("totalReviews");
  ensureNumber("successCount");
  ensureNumber("failureCount");
  ensureNumber("skipCount");

  if (!Array.isArray(stats.unlockedDecks)) {
    stats.unlockedDecks = [];
    modified = true;
  }

  const todayKey = toDateKey(now);
  if (!stats.daily || stats.daily.date !== todayKey) {
    stats.daily = {
      date: todayKey,
      reviews: 0,
      successes: 0,
      xp: 0,
      goal: resolveDailyGoal(user),
    };
    modified = true;
    sessionReset = true;
  } else if (
    stats.daily.goal == null ||
    Number.isNaN(Number(stats.daily.goal)) ||
    Number(stats.daily.goal) < 0
  ) {
    stats.daily.goal = resolveDailyGoal(user);
    modified = true;
  }

  const needsSessionReset =
    resetSession || hasSessionExpired(stats.session, now, todayKey);

  if (needsSessionReset) {
    stats.session = {
      startedAt: now,
      lastActivityAt: now,
      xp: 0,
      combo: 0,
      maxCombo: 0,
      achievements: [],
    };
    modified = true;
    sessionReset = true;
  } else if (!Array.isArray(stats.session.achievements)) {
    stats.session.achievements = [];
    modified = true;
  }

  return { stats, modified, sessionReset };
};

const buildSessionMeta = (stats) => ({
  xpEarned: stats.session?.xp || 0,
  streak: stats.streak || 0,
  combo: stats.session?.combo || 0,
  maxCombo: Math.max(stats.session?.maxCombo || 0, stats.maxCombo || 0),
  dailyProgress: stats.daily?.reviews || 0,
  dailyGoal: stats.daily?.goal != null ? Number(stats.daily.goal) : null,
  unlockedDecks: Array.isArray(stats.unlockedDecks) ? stats.unlockedDecks : [],
  achievements: Array.isArray(stats.session?.achievements)
    ? stats.session.achievements
    : [],
  cooldownUntil: stats.cooldownUntil || null,
  lastAward: stats.lastAward || null,
});

const isTruthyParam = (value) => {
  if (value == null) return false;
  const normalized = String(value).trim().toLowerCase();
  return ["1", "true", "yes", "reset", "y"].includes(normalized);
};

const ensureUser = async (event) => {
  const token = extractBearerToken(event);
  const decoded = verifyToken(token);
  const user = await User.findById(decoded.sub);
  if (!user) throw createHttpError(404, "User not found");
  return user;
};

const parseLimit = (value) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
};

const scheduleReview = (progress, result) => {
  const now = new Date();
  const ease = progress.easeFactor ?? 2.5;
  const interval = progress.interval ?? 0;
  const repetition = progress.repetition ?? 0;

  let nextEase = ease;
  let nextInterval = interval;
  let nextRepetition = repetition;
  let nextStatus = progress.status || "learning";

  if (result === "success") {
    if (nextRepetition === 0) {
      nextInterval = 1;
    } else if (nextRepetition === 1) {
      nextInterval = 6;
    } else {
      nextInterval = Math.round(nextInterval * (nextEase || 2.5));
    }
    nextRepetition += 1;
    nextEase = Math.min(3.0, (nextEase || 2.5) + 0.05);
    if (nextInterval >= 30) {
      nextStatus = "mastered";
    } else if (nextInterval >= 7) {
      nextStatus = "review";
    } else {
      nextStatus = "learning";
    }
  } else {
    nextRepetition = Math.max(0, nextRepetition - 1);
    nextInterval = 1;
    nextEase = Math.max(1.3, (nextEase || 2.5) - 0.2);
    nextStatus = "learning";
  }

  return {
    easeFactor: Number(nextEase.toFixed(2)),
    interval: nextInterval,
    repetition: nextRepetition,
    status: nextStatus,
    lastReviewedAt: now,
    nextReviewAt: new Date(now.getTime() + nextInterval * 24 * 60 * 60 * 1000),
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
      const mode = params.mode || "learn";
      const limit = parseLimit(params.limit);
      const now = new Date();
      const resetSessionRequested = isTruthyParam(
        params.resetSession || params.reset
      );
      const { stats: vocabStats, modified: statsModified } =
        ensureVocabularyStats(user, {
          now,
          resetSession: resetSessionRequested,
        });

      if (statsModified) {
        user.markModified("vocabularyStats");
        await user.save();
      }

      const sessionMeta = buildSessionMeta(vocabStats);
      const categoryParam = params.category;
      let categoryId = null;

      if (categoryParam) {
        if (mongoose.Types.ObjectId.isValid(categoryParam)) {
          categoryId = new mongoose.Types.ObjectId(categoryParam);
        } else {
          const category = await VocabularyCategory.findOne({
            slug: categoryParam,
          });
          categoryId = category ? category._id : null;
        }
      }

      if (mode === "review") {
        const now = new Date();
        const progressFilter = {
          user: user._id,
          status: { $ne: "mastered" },
          $or: [
            { nextReviewAt: { $lte: now } },
            { nextReviewAt: { $exists: false } },
          ],
        };
        if (categoryId) {
          progressFilter.category = categoryId;
        }

        const reviewItems = await VocabularyProgress.find(progressFilter)
          .sort({ nextReviewAt: 1 })
          .limit(limit)
          .populate({
            path: "word",
            populate: { path: "category", select: "name slug color" },
          })
          .lean();

        return respond(200, {
          mode: "review",
          items: reviewItems.map((item) => ({
            progressId: item._id,
            word: item.word,
            status: item.status,
            nextReviewAt: item.nextReviewAt,
            lastReviewedAt: item.lastReviewedAt,
            easeFactor: item.easeFactor,
            interval: item.interval,
            repetition: item.repetition,
          })),
          session: sessionMeta,
        });
      }

      // Learn mode: find published words not yet studied by user
      const studiedWordIds = await VocabularyProgress.find({
        user: user._id,
      }).distinct("word");
      const filter = {
        owner: { $exists: false },
        status: "published",
        _id: { $nin: studiedWordIds },
      };
      if (categoryId) {
        filter.$or = [{ category: categoryId }, { subcategories: categoryId }];
      }
      const learnItems = await WordEntry.find(filter)
        .sort({ difficulty: 1, term: 1 })
        .limit(limit)
        .populate({ path: "category", select: "name slug color" })
        .lean();

      return respond(200, {
        mode: "learn",
        items: learnItems,
        session: sessionMeta,
      });
    }

    // POST - update review result
    const body = parseBody(event.body);
    const { wordId, result, progressId, durationMs, categoryId } = body;

    if (!wordId || !mongoose.Types.ObjectId.isValid(wordId)) {
      throw createHttpError(400, "Valid wordId is required");
    }

    if (!["success", "failure", "skipped"].includes(result || "")) {
      throw createHttpError(400, "result must be success, failure or skipped");
    }

    const word = await WordEntry.findById(wordId);
    if (!word) throw createHttpError(404, "Word not found");

    const now = new Date();
    const ensureResult = ensureVocabularyStats(user, { now });
    let statsModified = ensureResult.modified;
    const vocabStats = ensureResult.stats;
    let studyStatsModified = false;

    let progress = null;
    if (progressId && mongoose.Types.ObjectId.isValid(progressId)) {
      progress = await VocabularyProgress.findOne({
        _id: progressId,
        user: user._id,
      });
    }
    if (!progress) {
      progress = await VocabularyProgress.findOne({
        user: user._id,
        word: word._id,
      });
    }

    if (!progress) {
      progress = new VocabularyProgress({
        user: user._id,
        word: word._id,
        category:
          categoryId && mongoose.Types.ObjectId.isValid(categoryId)
            ? new mongoose.Types.ObjectId(categoryId)
            : word.category,
        status: "learning",
      });
    }

    const previousStatus = progress.status || "learning";

    const schedule =
      result === "skipped"
        ? {
            status: progress.status,
            lastReviewedAt: new Date(),
            nextReviewAt: progress.nextReviewAt || new Date(),
            easeFactor: progress.easeFactor,
            interval: progress.interval,
            repetition: progress.repetition,
          }
        : scheduleReview(progress, result);

    const eventTime = schedule.lastReviewedAt || new Date();

    progress.status = schedule.status;
    progress.easeFactor = schedule.easeFactor;
    progress.interval = schedule.interval;
    progress.repetition = schedule.repetition;
    progress.lastReviewedAt = schedule.lastReviewedAt;
    progress.nextReviewAt = schedule.nextReviewAt;
    progress.deck =
      progress.deck || (schedule.status === "review" ? "review" : "learn");
    progress.category = progress.category || word.category;
    progress.reviewHistory = progress.reviewHistory || [];
    progress.reviewHistory.push({
      reviewedAt: eventTime,
      result,
      easeFactor: progress.easeFactor,
      interval: progress.interval,
      durationMs,
    });

    await progress.save();

    const statsUpdate =
      result === "success"
        ? { "stats.totalReviews": 1, "stats.successCount": 1 }
        : { "stats.totalReviews": 1, "stats.failCount": 1 };

    await WordEntry.updateOne(
      { _id: word._id },
      {
        $inc: statsUpdate,
        $set: {
          reviewState: progress.status,
          lastReviewedAt: progress.lastReviewedAt,
          nextReviewAt: progress.nextReviewAt,
        },
      }
    );

    const countsAsAttempt = result !== "skipped";
    const isSuccess = result === "success";
    const xpAwarded = XP_REWARD[result] ?? 0;

    if (countsAsAttempt) {
      vocabStats.totalReviews += 1;
      if (isSuccess) {
        vocabStats.successCount += 1;
      } else {
        vocabStats.failureCount += 1;
      }
    } else {
      vocabStats.skipCount += 1;
    }

    if (xpAwarded) {
      vocabStats.xp += xpAwarded;
    }

    if (isSuccess) {
      vocabStats.streak += 1;
      vocabStats.combo += 1;
    } else if (countsAsAttempt) {
      vocabStats.streak = 0;
      vocabStats.combo = 0;
    }

    vocabStats.longestStreak = Math.max(
      vocabStats.longestStreak || 0,
      vocabStats.streak || 0
    );

    const session = vocabStats.session || {};
    session.lastActivityAt = eventTime;
    if (!session.startedAt) session.startedAt = eventTime;
    if (xpAwarded) {
      session.xp = (session.xp || 0) + xpAwarded;
    }
    if (isSuccess) {
      session.combo = (session.combo || 0) + 1;
    } else if (countsAsAttempt) {
      session.combo = 0;
    }
    session.maxCombo = Math.max(session.maxCombo || 0, session.combo || 0);
    if (!Array.isArray(session.achievements)) {
      session.achievements = [];
    }
    vocabStats.session = session;

    vocabStats.maxCombo = Math.max(
      vocabStats.maxCombo || 0,
      vocabStats.combo || 0,
      session.maxCombo || 0
    );

    const eventDateKey = toDateKey(eventTime);
    const daily = vocabStats.daily || {
      date: eventDateKey,
      reviews: 0,
      successes: 0,
      xp: 0,
      goal: resolveDailyGoal(user),
    };

    if (daily.date !== eventDateKey) {
      daily.date = eventDateKey;
      daily.reviews = 0;
      daily.successes = 0;
      daily.xp = 0;
      daily.goal = resolveDailyGoal(user);
    }

    if (countsAsAttempt) {
      daily.reviews = (daily.reviews || 0) + 1;
      if (isSuccess) {
        daily.successes = (daily.successes || 0) + 1;
      }
    }
    if (xpAwarded) {
      daily.xp = (daily.xp || 0) + xpAwarded;
    }
    if (daily.goal == null || Number(daily.goal) <= 0) {
      daily.goal = resolveDailyGoal(user);
    }

    vocabStats.daily = daily;

    if (xpAwarded > 0) {
      vocabStats.lastAward = {
        type: result,
        label: isSuccess ? "Doğru cevap" : "Tekrar dene",
        xp: xpAwarded,
        awardedAt: eventTime,
      };
    }

    statsModified = true;

    if (!user.studyStats || typeof user.studyStats !== "object") {
      user.studyStats = {
        wordsAdded: 0,
        wordsMastered: 0,
        totalReviews: 0,
        grammarTopicsStarted: 0,
        grammarTopicsCompleted: 0,
      };
      studyStatsModified = true;
    }
    if (countsAsAttempt) {
      user.studyStats.totalReviews = (user.studyStats.totalReviews || 0) + 1;
      studyStatsModified = true;
    }
    if (previousStatus !== "mastered" && schedule.status === "mastered") {
      user.studyStats.wordsMastered = (user.studyStats.wordsMastered || 0) + 1;
      studyStatsModified = true;
    }

    const dailyInc = {
      xpEarned: xpAwarded,
      pointsEarned: xpAwarded,
    };
    if (countsAsAttempt) {
      dailyInc.wordsReviewed = 1;
    }
    if (previousStatus !== "mastered" && schedule.status === "mastered") {
      dailyInc.wordsMastered = 1;
    }

    await DailyUserStat.findOneAndUpdate(
      { user: user._id, date: eventDateKey },
      {
        $inc: dailyInc,
        $set: { streakActive: vocabStats.streak > 0 },
      },
      { upsert: true }
    );

    try {
      await ReviewLog.create({
        user: user._id,
        type: "word",
        refId: word._id,
        action:
          result === "success"
            ? schedule.status === "mastered" && previousStatus !== "mastered"
              ? "promote"
              : "review"
            : result === "failure"
            ? "demote"
            : "review",
        beforeStatus: previousStatus,
        afterStatus: progress.status,
        intervalDays: progress.interval,
        easeFactor: progress.easeFactor,
        correct: isSuccess,
        timeSpentSec: durationMs ? Math.round(durationMs / 1000) : 0,
        reviewedAt: eventTime,
      });
    } catch (logError) {
      console.error("[vocabulary-review] review log failed", logError);
    }

    if (statsModified) {
      user.markModified("vocabularyStats");
    }
    if (studyStatsModified) {
      user.markModified("studyStats");
    }
    if (statsModified || studyStatsModified) {
      await user.save();
    }

    const sessionMeta = buildSessionMeta(vocabStats);
    const reward = {
      xp: xpAwarded,
      streak: vocabStats.streak || 0,
      combo: vocabStats.session?.combo || 0,
      dailyProgress: vocabStats.daily?.reviews || 0,
    };

    return respond(200, {
      success: true,
      progress: progress.toObject(),
      reward,
      session: sessionMeta,
      meta: sessionMeta,
    });
  } catch (error) {
    return handleError(error, "vocabulary-review");
  }
};
