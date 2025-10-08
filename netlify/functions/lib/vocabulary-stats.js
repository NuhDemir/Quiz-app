const User = require("../../../models/User");

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

const recordGameResult = (
  user,
  {
    now = new Date(),
    xpDelta = 0,
    comboDelta = 0,
    successDelta = 0,
    failureDelta = 0,
  } = {}
) => {
  const ensureResult = ensureVocabularyStats(user, { now });
  const { stats } = ensureResult;
  let modified = ensureResult.modified;

  stats.xp = Math.max(0, (stats.xp || 0) + xpDelta);
  stats.totalReviews = Math.max(0, (stats.totalReviews || 0) + successDelta);
  stats.successCount = Math.max(0, (stats.successCount || 0) + successDelta);
  stats.failureCount = Math.max(0, (stats.failureCount || 0) + failureDelta);

  if (!stats.session) {
    stats.session = {
      startedAt: now,
      lastActivityAt: now,
      xp: 0,
      combo: 0,
      maxCombo: 0,
      achievements: [],
    };
    modified = true;
  }

  stats.session.lastActivityAt = now;
  stats.session.xp = Math.max(0, (stats.session.xp || 0) + xpDelta);
  stats.session.combo = Math.max(0, (stats.session.combo || 0) + comboDelta);
  stats.session.maxCombo = Math.max(
    stats.session.maxCombo || 0,
    stats.session.combo || 0
  );

  if (stats.daily) {
    stats.daily.reviews = Math.max(
      0,
      (stats.daily.reviews || 0) + successDelta
    );
    stats.daily.successes = Math.max(
      0,
      (stats.daily.successes || 0) + successDelta
    );
    stats.daily.xp = Math.max(0, (stats.daily.xp || 0) + xpDelta);
  }

  return { stats, modified: true };
};

module.exports = {
  toDateKey,
  ensureVocabularyStats,
  buildSessionMeta,
  recordGameResult,
  resolveDailyGoal,
  hasSessionExpired,
};
