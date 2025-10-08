import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { vocabularyApi } from "../utils/endpoints";

const INITIAL_STATS = {
  total: 0,
  reviewed: 0,
  correct: 0,
  streak: 0,
  lapses: 0,
  skipped: 0,
};

const INITIAL_SESSION_META = {
  xpEarned: 0,
  streak: 0,
  combo: 0,
  maxCombo: 0,
  dailyProgress: 0,
  dailyGoal: null,
  unlockedDecks: [],
  achievements: [],
  cooldownUntil: null,
  lastAward: null,
};

const ratingPresets = {
  again: {
    result: "failure",
    requeueOffset: 1,
    countsAsSuccess: false,
    countsAsAttempt: true,
  },
  hard: {
    result: "failure",
    requeueOffset: 3,
    countsAsSuccess: false,
    countsAsAttempt: true,
  },
  good: {
    result: "success",
    requeueOffset: null,
    countsAsSuccess: true,
    countsAsAttempt: true,
  },
  easy: {
    result: "success",
    requeueOffset: null,
    countsAsSuccess: true,
    countsAsAttempt: true,
  },
  skip: {
    result: "skipped",
    requeueOffset: "end",
    countsAsSuccess: false,
    countsAsAttempt: false,
    isSkip: true,
  },
};

const buildCard = (item) => {
  const word = item.word || item;
  const progressId = item.progressId || item._id || word?._id || word?.id;
  const key = progressId || word?._id || word?.id;

  return {
    ...item,
    word,
    progressId,
    key,
    sessionRepetition: item.sessionRepetition || 0,
    lastRating: item.lastRating || null,
  };
};

const normalizeSessionMeta = (
  raw = {},
  prev = INITIAL_SESSION_META,
  { reset = false } = {}
) => {
  const base = reset ? INITIAL_SESSION_META : prev || INITIAL_SESSION_META;

  const safeNumber = (value, fallback = 0) =>
    Number.isFinite(value) ? value : fallback;

  const combo = Math.max(0, safeNumber(raw.combo, base.combo || 0));
  const maxComboCandidate = safeNumber(raw.maxCombo, base.maxCombo || 0);

  const unlockedDecks = Array.isArray(raw.unlockedDecks)
    ? raw.unlockedDecks
    : base.unlockedDecks || [];
  const achievements = Array.isArray(raw.achievements)
    ? raw.achievements
    : base.achievements || [];

  return {
    ...base,
    xpEarned: Math.max(0, safeNumber(raw.xpEarned, base.xpEarned || 0)),
    streak: Math.max(0, safeNumber(raw.streak, base.streak || 0)),
    combo,
    maxCombo: Math.max(combo, maxComboCandidate),
    dailyProgress: Math.max(
      0,
      safeNumber(raw.dailyProgress, base.dailyProgress || 0)
    ),
    dailyGoal: safeNumber(
      raw.dailyGoal,
      base.dailyGoal != null ? base.dailyGoal : null
    ),
    unlockedDecks,
    achievements,
    cooldownUntil: raw.cooldownUntil || base.cooldownUntil || null,
    lastAward: raw.lastAward || raw.award || null,
  };
};

export default function useVocabularyReview({
  mode = "learn",
  category,
  autoFetch = true,
  limit = 10,
} = {}) {
  const token = useSelector((state) => state.auth?.token);
  const [queueState, setQueueState] = useState([]);
  const queueRef = useRef(queueState);
  const setQueue = useCallback((updater) => {
    queueRef.current =
      typeof updater === "function" ? updater(queueRef.current) : updater;
    setQueueState(queueRef.current);
  }, []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [stats, setStats] = useState(INITIAL_STATS);
  const [sessionMeta, setSessionMeta] = useState(INITIAL_SESSION_META);

  const inflight = useRef(false);

  const mergeQueue = useCallback((incoming, { reset } = {}) => {
    const baseQueue = reset ? [] : queueRef.current;
    const existingKeys = new Set(baseQueue.map((card) => card.key));
    const merged = [...baseQueue];

    incoming.forEach((card) => {
      if (!existingKeys.has(card.key)) {
        merged.push({ ...card, sessionRepetition: 0, lastRating: null });
        existingKeys.add(card.key);
      }
    });

    return merged;
  }, []);

  const fetchQueue = useCallback(
    async ({ reset = false } = {}) => {
      if (inflight.current) return;
      inflight.current = true;
      setLoading(true);
      setError(null);

      try {
        const payload = await vocabularyApi.reviewQueue({
          token,
          mode,
          limit,
          category,
          resetSession: reset,
        });
        const cards = (payload.items || []).map(buildCard);

        setQueue(mergeQueue(cards, { reset }));

        if (reset) {
          setStats({
            ...INITIAL_STATS,
            total: cards.length,
          });
          setSessionMeta((prev) =>
            normalizeSessionMeta(payload.session || payload.meta, prev, {
              reset: true,
            })
          );
        } else {
          setStats((prev) => ({
            ...prev,
            total: Math.max(
              prev.total,
              prev.reviewed + queueRef.current.length
            ),
          }));
          setSessionMeta((prev) =>
            normalizeSessionMeta(payload.session || payload.meta, prev)
          );
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
        inflight.current = false;
      }
    },
    [token, mode, limit, category, setQueue, mergeQueue]
  );

  useEffect(() => {
    if (!autoFetch) return;
    fetchQueue({ reset: true });
  }, [fetchQueue, autoFetch]);

  const queue = queueState;
  const currentCard = useMemo(() => queue[0] || null, [queue]);

  const topUpIfNeeded = useCallback(() => {
    const remaining = queueRef.current.length;
    if (remaining === 0) {
      fetchQueue({ reset: true });
      return;
    }
    const threshold = Math.max(3, Math.floor(limit / 2));
    if (remaining < threshold) {
      fetchQueue();
    }
  }, [fetchQueue, limit]);

  const gradeCard = useCallback(
    async ({ rating, durationMs } = {}) => {
      const activeQueue = queueRef.current;
      if (!activeQueue.length) return;

      const card = activeQueue[0];
      const preset = ratingPresets[rating] || ratingPresets.good;
      const wordId = card.word?._id || card.word?.id || card.wordId;
      const progressId = card.progressId;

      if (!wordId) return;

      setLastResult(null);

      setQueue((prev) => {
        const [, ...rest] = prev;
        let nextQueue = rest;

        let offset = preset.requeueOffset;
        if (offset === "end") {
          offset = rest.length;
        }

        if (offset != null) {
          const insertIndex = Math.min(Math.max(offset, 0), rest.length);
          const requeuedCard = {
            ...card,
            sessionRepetition: (card.sessionRepetition || 0) + 1,
            lastRating: rating,
          };
          nextQueue = [
            ...rest.slice(0, insertIndex),
            requeuedCard,
            ...rest.slice(insertIndex),
          ];
        }

        return nextQueue;
      });

      setStats((prev) => {
        const countsAsAttempt = preset.countsAsAttempt !== false;
        const reviewed = countsAsAttempt ? prev.reviewed + 1 : prev.reviewed;
        const correct =
          countsAsAttempt && preset.countsAsSuccess
            ? prev.correct + 1
            : prev.correct;
        const lapses =
          countsAsAttempt && !preset.countsAsSuccess && !preset.isSkip
            ? prev.lapses + 1
            : prev.lapses;
        const streak = countsAsAttempt
          ? preset.countsAsSuccess
            ? prev.streak + 1
            : 0
          : prev.streak;
        const skipped = preset.isSkip ? (prev.skipped || 0) + 1 : prev.skipped;

        return {
          total: Math.max(prev.total, reviewed + queueRef.current.length),
          reviewed,
          correct,
          streak,
          lapses,
          skipped,
        };
      });

      try {
        const payload = await vocabularyApi.submitReview({
          token,
          wordId,
          result: preset.result,
          progressId,
          durationMs,
          categoryId:
            card.word?.category?._id ||
            card.word?.category ||
            card.category?._id ||
            card.category,
        });
        setSessionMeta((prev) =>
          normalizeSessionMeta(payload.session || payload.meta, prev)
        );
        setLastResult({ success: true, payload, rating });
        topUpIfNeeded();
        return payload;
      } catch (err) {
        // revert optimistic update
        setQueue((prev) => [card, ...prev]);
        setStats((prev) => ({
          ...prev,
          reviewed:
            preset.countsAsAttempt !== false
              ? Math.max(prev.reviewed - 1, 0)
              : prev.reviewed,
          correct:
            preset.countsAsAttempt !== false && preset.countsAsSuccess
              ? Math.max(prev.correct - 1, 0)
              : prev.correct,
          lapses:
            preset.countsAsAttempt !== false &&
            !preset.countsAsSuccess &&
            !preset.isSkip
              ? Math.max(prev.lapses - 1, 0)
              : prev.lapses,
          skipped: preset.isSkip
            ? Math.max((prev.skipped || 1) - 1, 0)
            : prev.skipped,
          streak: 0,
        }));
        setLastResult({ success: false, error: err, rating });
        setError(err);
        throw err;
      }
    },
    [setQueue, topUpIfNeeded, token]
  );

  const skipCard = useCallback(
    async ({ durationMs } = {}) => gradeCard({ rating: "skip", durationMs }),
    [gradeCard]
  );

  const refresh = useCallback(
    ({ reset = true } = {}) => fetchQueue({ reset }),
    [fetchQueue]
  );

  const isSessionComplete = useMemo(
    () => !loading && queue.length === 0 && stats.reviewed > 0,
    [loading, queue.length, stats.reviewed]
  );

  return {
    queue,
    currentCard,
    loading,
    error,
    lastResult,
    stats,
    isSessionComplete,
    refresh,
    gradeCard,
    skipCard,
    sessionMeta,
  };
}
