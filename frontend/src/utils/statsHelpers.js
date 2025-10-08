// Kullanıcıya özel öneriler ve gelişim ipuçları üretir
export const buildSuggestions = (aggregatedProgress, leaderboard = []) => {
  const suggestions = [];
  // Zayıf kategori
  const categoryEntries = Object.entries(
    aggregatedProgress.categoryStats || {}
  );
  const weakest = categoryEntries.sort(
    (a, b) => (a[1]?.accuracy ?? 100) - (b[1]?.accuracy ?? 100)
  )[0];
  if (weakest && weakest[1]?.accuracy < 60) {
    suggestions.push({
      id: `focus-${weakest[0]}`,
      title: `Daha fazla çalış: ${weakest[0]}`,
      description: `Bu kategoride doğruluk oranınız %${weakest[1].accuracy}. Tekrar quiz çözerek gelişebilirsiniz.`,
      metric: `%${weakest[1].accuracy}`,
    });
  }
  // XP hedefi
  if (aggregatedProgress.xp && aggregatedProgress.xp < 1000) {
    suggestions.push({
      id: "xp-target",
      title: "XP Hedefi: 1000'e ulaş!",
      description: "Düzenli quiz çözerek XP biriktir, yeni rozetler kazan.",
      metric: `${aggregatedProgress.xp} XP`,
    });
  }
  // Streak
  if (aggregatedProgress.streak && aggregatedProgress.streak < 5) {
    suggestions.push({
      id: "streak-build",
      title: "Seri Yapmaya Başla",
      description:
        "Arka arkaya doğru cevaplar ile streak rekorunu kırabilirsin.",
      metric: `${aggregatedProgress.streak} seri`,
    });
  }
  // Topluluk kıyası
  if (leaderboard.length) {
    const user = leaderboard.find((l) => l.isCurrentUser);
    if (user && user.rank > 5) {
      suggestions.push({
        id: "leaderboard-chase",
        title: "Liderlik Tablosunda Yüksel!",
        description: `Şu an ${user.rank}. sıradasın. Daha fazla quiz çözerek üst sıralara çıkabilirsin.`,
        metric: `Sıra: ${user.rank}`,
      });
    }
  }
  return suggestions;
};
// Topluluk yüzdelik dilimi hesaplar
// Oturum ısı haritası için veri hazırlar
export const buildSessionHeatmapData = (recentSessions = []) => {
  // Gün ve saat bazlı matris
  const matrix = Array(7)
    .fill(0)
    .map(() => Array(24).fill(0));
  const dayLabels = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
  const hourLabels = Array.from(
    { length: 24 },
    (_, hour) => `${hour.toString().padStart(2, "0")}:00`
  );
  let max = 0;
  recentSessions.forEach((session) => {
    if (!session.takenAt) return;
    const date = new Date(session.takenAt);
    const day = date.getDay(); // 0: Pazar, 6: Cumartesi
    const hour = date.getHours();
    if (!Number.isFinite(day) || !Number.isFinite(hour)) return;
    if (!matrix[day]) return;
    matrix[day][hour] += 1;
    max = Math.max(max, matrix[day][hour]);
  });
  return { matrix, dayLabels, hourLabels, max };
};
export const buildAggregatedProgress = ({ progress, stats, attempts } = {}) => {
  if (progress) {
    const vocabulary = progress.vocabulary || null;
    const xp = vocabulary?.xp ?? progress.xp ?? 0;
    const streak = vocabulary?.streak ?? progress.streak ?? 0;
    return {
      totalQuizzes: progress.totalQuizzes || 0,
      accuracy: progress.accuracy || 0,
      streak,
      xp,
      badges: Array.isArray(progress.badges) ? progress.badges : [],
      recentSessions: Array.isArray(progress.recentSessions)
        ? progress.recentSessions
        : [],
      categoryStats: progress.categoryStats || {},
      levelStats: progress.levelStats || {},
      userId: progress.userId || null,
      updatedAt: progress.updatedAt || null,
      vocabulary,
    };
  }

  const fallbackAttempts = Array.isArray(attempts?.items)
    ? attempts.items
    : Array.isArray(attempts)
    ? attempts
    : [];

  return {
    totalQuizzes: stats?.totalQuestions || 0,
    accuracy: stats?.accuracy || 0,
    streak: stats?.streak || 0,
    xp: (stats?.totalQuestions || 0) * 10,
    badges: Array.isArray(stats?.badges) ? stats.badges : [],
    recentSessions: fallbackAttempts,
    categoryStats: stats?.categoryStats || {},
    levelStats: stats?.levelStats || {},
    userId: stats?.userId || null,
    updatedAt: stats?.updatedAt || null,
    vocabulary: null,
  };
};

export const computeAverageSessionTime = (recentSessions = []) => {
  const durations = recentSessions
    .map((session) => session.duration || session.durationSec || 0)
    .filter((value) => value > 0);

  if (!durations.length) return 0;
  const sum = durations.reduce((acc, value) => acc + value, 0);
  return Math.round(sum / durations.length);
};

export const buildXpLevelInfo = (xp = 0, step = 500) => {
  const sanitizedXp = Number.isFinite(xp) ? Math.max(0, xp) : 0;
  const STEP = step || 500;
  const level = Math.max(1, Math.floor(sanitizedXp / STEP) + 1);
  const currentFloor = (level - 1) * STEP;
  const nextLevel = level * STEP;
  const progressPct =
    nextLevel === currentFloor
      ? 100
      : Math.min(
          100,
          Math.max(
            0,
            Math.round(
              ((sanitizedXp - currentFloor) / (nextLevel - currentFloor)) * 100
            )
          )
        );

  return {
    level,
    nextLevel,
    progressPct,
    xpToNext: Math.max(nextLevel - sanitizedXp, 0),
    currentFloor,
    xp: sanitizedXp,
  };
};

const normalizeCategoryEntries = (categoryStats) =>
  Object.entries(categoryStats || {}).map(([key, value]) => ({
    key,
    accuracy: value?.accuracy ?? null,
    attempts: value?.attempts ?? 0,
    correct: value?.correct ?? 0,
  }));

export const buildQuickInsights = (aggregatedProgress) => {
  const { badges, recentSessions, categoryStats } = aggregatedProgress || {};

  const lastSession = recentSessions?.[0];
  const lastActive = lastSession?.takenAt
    ? new Date(lastSession.takenAt)
    : null;
  const activeText = lastActive ? lastActive.toLocaleDateString() : "-";

  const categoryEntries = normalizeCategoryEntries(categoryStats);

  const bestCategory = [...categoryEntries].sort(
    (a, b) => (b.accuracy ?? 0) - (a.accuracy ?? 0)
  )[0];

  const hardestCategory = [...categoryEntries].sort(
    (a, b) => (a.accuracy ?? 100) - (b.accuracy ?? 100)
  )[0];

  return [
    {
      label: "Rozetler",
      value: badges?.length || 0,
      helper: "Kazanılan toplam rozet",
    },
    {
      label: "Son Aktivite",
      value: activeText,
      helper: lastSession?.category
        ? `${lastSession.category} kategorisi`
        : "Son oturum bilgisi",
    },
    {
      label: "En Güçlü Kategori",
      value: bestCategory?.key || "Veri yok",
      helper:
        bestCategory?.accuracy != null
          ? `%${bestCategory.accuracy} doğruluk`
          : "Yeterli veri yok",
    },
    {
      label: "Zorlandığın Kategori",
      value: hardestCategory?.key || "Veri yok",
      helper:
        hardestCategory?.accuracy != null
          ? `%${hardestCategory.accuracy} doğruluk`
          : "Yeterli veri yok",
    },
  ];
};

export const buildRecentAccuracyTrend = (recentSessions = []) =>
  recentSessions
    .slice()
    .reverse()
    .map((session, index) => ({
      name: session.category || `Quiz ${index + 1}`,
      accuracy: session.accuracy ?? session.score ?? 0,
      score: session.score ?? session.accuracy ?? 0,
      duration: session.durationSec || session.duration || 0,
      takenAt: session.takenAt || null,
    }));

export const buildCategoryRadarData = (categoryStats = {}) =>
  Object.entries(categoryStats).map(([key, value]) => ({
    category: key,
    accuracy: value?.accuracy ?? 0,
    attempts: value?.attempts ?? 0,
  }));

export const buildPeerComparison = (leaderboardItems = [], currentUserId) => {
  return leaderboardItems.map((item, index) => ({
    rank: index + 1,
    userId: item.id,
    username: item.username,
    points: item.points,
    accuracy: item.accuracy,
    totalQuizzes: item.totalQuizzes,
    longestStreak: item.longestStreak,
    isCurrentUser:
      currentUserId &&
      (item.id === currentUserId ||
        item._id === currentUserId ||
        item.userId === currentUserId),
  }));
};

export const buildImprovementSuggestions = (
  aggregatedProgress = {},
  { xpInfo, leaderboardItems = [], currentUserId, limit = 3 } = {}
) => {
  const suggestions = [];

  const safeXpInfo = xpInfo || buildXpLevelInfo(aggregatedProgress.xp);
  const recentSessions = Array.isArray(aggregatedProgress.recentSessions)
    ? aggregatedProgress.recentSessions
    : [];

  const categoryEntries = normalizeCategoryEntries(
    aggregatedProgress.categoryStats
  ).filter((entry) => entry.attempts >= 2 && entry.accuracy != null);

  if (categoryEntries.length) {
    const lowestCategory = [...categoryEntries].sort(
      (a, b) => (a.accuracy ?? 101) - (b.accuracy ?? 101)
    )[0];

    if (lowestCategory) {
      suggestions.push({
        id: `category-${lowestCategory.key}`,
        title: `${lowestCategory.key} kategorisini güçlendir`,
        description: `${
          lowestCategory.key
        } kategorisinde doğruluk oranı %${Math.round(
          lowestCategory.accuracy || 0
        )}. Kısa bir tekrar oturumu ile gelişimini hızlandırabilirsin.`,
        metric: `%${Math.round(lowestCategory.accuracy || 0)}`,
      });
    }
  }

  if (safeXpInfo?.xpToNext > 0) {
    suggestions.push({
      id: "xp-progress",
      title: "Bir sonraki seviyeye yaklaş",
      description: `${safeXpInfo.xpToNext} XP sonra ${
        safeXpInfo.level + 1
      }. seviyeye ulaşacaksın.`,
      metric: `${safeXpInfo.xpToNext} XP`,
    });
  }

  const lastActiveSession = recentSessions.find((session) => session?.takenAt);
  if (lastActiveSession?.takenAt) {
    const lastDate = new Date(lastActiveSession.takenAt);
    if (!Number.isNaN(lastDate.getTime())) {
      const diffDays = Math.floor(
        (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (Number.isFinite(diffDays) && diffDays >= 3) {
        suggestions.push({
          id: "streak-recovery",
          title: "Serini geri kazan",
          description: `${diffDays} gündür quiz çözülmedi. Kısa bir oturumla serini tazele.`,
          metric: `${diffDays} gün`,
        });
      }
    }
  } else {
    suggestions.push({
      id: "first-session",
      title: "İlk quizini başlat",
      description:
        "Henüz kayıtlı bir quiz oturumun yok. Hızlı bir başlangıç ile ilerlemeni takip edebiliriz.",
    });
  }

  const sortedLeaderboard = Array.isArray(leaderboardItems)
    ? leaderboardItems.slice().sort((a, b) => (b.points || 0) - (a.points || 0))
    : [];

  const currentUserEntry = sortedLeaderboard.find((entry) =>
    currentUserId
      ? entry.id === currentUserId ||
        entry.userId === currentUserId ||
        entry._id === currentUserId
      : false
  );

  if (currentUserEntry) {
    const nearestAhead = sortedLeaderboard.find(
      (entry) => (entry.points || 0) > (currentUserEntry.points || 0)
    );

    if (nearestAhead) {
      const delta = Math.max(
        (nearestAhead.points || 0) - (currentUserEntry.points || 0),
        0
      );

      if (delta > 0) {
        suggestions.push({
          id: "peer-chase",
          title: `${nearestAhead.username} ile aranı kapat`,
          description: `${nearestAhead.username} kullanıcısına yetişmek için ${delta} XP yeterli.`,
          metric: `${delta} XP`,
        });
      }
    }
  }

  return suggestions.slice(0, limit);
};

export const buildPeerDistribution = (
  leaderboardItems = [],
  currentUserId,
  buckets = [
    { label: "%0-50", min: 0, max: 50 },
    { label: "%50-70", min: 50, max: 70 },
    { label: "%70-85", min: 70, max: 85 },
    { label: "%85-95", min: 85, max: 95 },
    { label: "%95+", min: 95, max: 101 },
  ]
) => {
  const totals = buckets.map(() => 0);
  let currentBucketIndex = null;

  const players = Array.isArray(leaderboardItems) ? leaderboardItems : [];

  players.forEach((item) => {
    const accuracy = Number.isFinite(item?.accuracy)
      ? Math.max(0, Math.min(100, item.accuracy))
      : null;

    let bucketIndex = buckets.length - 1;

    if (accuracy != null) {
      const foundIndex = buckets.findIndex(
        (bucket) => accuracy >= bucket.min && accuracy < bucket.max
      );
      bucketIndex = foundIndex >= 0 ? foundIndex : bucketIndex;
    }

    totals[bucketIndex] += 1;

    if (
      currentUserId &&
      (item.id === currentUserId ||
        item.userId === currentUserId ||
        item._id === currentUserId)
    ) {
      currentBucketIndex = bucketIndex;
    }
  });

  const totalPlayers = players.length || 1;

  return buckets.map((bucket, index) => ({
    label: bucket.label,
    count: totals[index],
    percentage: Math.round((totals[index] / totalPlayers) * 100),
    isCurrentUserBucket: currentBucketIndex === index,
  }));
};

export const buildSessionHeatmap = (recentSessions = []) => {
  const DAYS = [1, 2, 3, 4, 5, 6, 0];
  const DAY_LABELS = {
    0: "Paz",
    1: "Pzt",
    2: "Sal",
    3: "Çar",
    4: "Per",
    5: "Cum",
    6: "Cmt",
  };

  const SLOTS = [
    { key: "morning", label: "Sabah" },
    { key: "afternoon", label: "Öğle" },
    { key: "evening", label: "Akşam" },
    { key: "night", label: "Gece" },
  ];

  const matrix = DAYS.map(() => SLOTS.map(() => 0));
  const totalsByDay = DAYS.map(() => 0);
  const totalsBySlot = SLOTS.map(() => 0);

  let maxValue = 0;

  const getSlotIndex = (hour) => {
    if (hour >= 5 && hour < 12) return 0;
    if (hour >= 12 && hour < 17) return 1;
    if (hour >= 17 && hour < 22) return 2;
    return 3;
  };

  recentSessions.forEach((session) => {
    const rawDate =
      session?.takenAt || session?.completedAt || session?.createdAt;
    const date = rawDate ? new Date(rawDate) : null;

    if (!date || Number.isNaN(date.getTime())) return;

    const dayIndex = DAYS.indexOf(date.getDay());
    if (dayIndex === -1) return;

    const slotIndex = getSlotIndex(date.getHours());

    matrix[dayIndex][slotIndex] += 1;
    totalsByDay[dayIndex] += 1;
    totalsBySlot[slotIndex] += 1;
    maxValue = Math.max(maxValue, matrix[dayIndex][slotIndex]);
  });

  const points = DAYS.flatMap((day, dayIdx) =>
    SLOTS.map((slot, slotIdx) => ({
      day: DAY_LABELS[day],
      slot: slot.label,
      value: matrix[dayIdx][slotIdx],
    }))
  );

  return {
    points,
    matrix,
    max: maxValue,
    days: DAYS.map((day) => DAY_LABELS[day]),
    slots: SLOTS.map((slot) => slot.label),
    totalsByDay,
    totalsBySlot,
  };
};
