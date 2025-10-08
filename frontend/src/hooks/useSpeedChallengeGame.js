import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { vocabularyGamesApi } from "../utils/endpoints";

const initialSession = {
  sessionId: null,
  cards: [],
  answered: [],
  durationMs: 30000,
  state: { status: "idle", metadata: {} },
  result: {
    correct: 0,
    incorrect: 0,
    skipped: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    xpEarned: 0,
  },
};

export default function useSpeedChallengeGame({
  autoStart = false,
  category,
} = {}) {
  const token = useSelector((state) => state.auth?.token);
  const [session, setSession] = useState(initialSession);
  const [sessionMeta, setSessionMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(initialSession.durationMs);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(
    (duration) => {
      clearTimer();
      setTimeRemaining(duration);
      setIsRunning(true);
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1000) {
            clearTimer();
            setIsRunning(false);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
    },
    [clearTimer]
  );

  const resetState = useCallback(() => {
    clearTimer();
    setSession(initialSession);
    setSessionMeta(null);
    setError(null);
    setSubmitting(false);
    setTimeRemaining(initialSession.durationMs);
    setIsRunning(false);
  }, [clearTimer]);

  const startGame = useCallback(
    async ({ limit } = {}) => {
      if (!token) {
        setError(new Error("Oturum açmak gerekli"));
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await vocabularyGamesApi.speedChallengeStart({
          token,
          category,
          limit,
        });
        if (!response?.session) {
          resetState();
          return response;
        }
        const { session: sessionPayload, sessionMeta: meta } = response;
        setSession({
          sessionId: sessionPayload.sessionId,
          cards: sessionPayload.cards || [],
          answered: sessionPayload.answered || [],
          durationMs: sessionPayload.durationMs || initialSession.durationMs,
          state: sessionPayload.state || initialSession.state,
          result: sessionPayload.result || initialSession.result,
        });
        setSessionMeta(meta || null);
        startTimer(sessionPayload.durationMs || initialSession.durationMs);
        return response;
      } catch (err) {
        setError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, category, resetState, startTimer]
  );

  const activeCard = useMemo(() => {
    const answeredIds = new Set(session.answered.map((entry) => entry.cardId));
    return session.cards.find((card) => !answeredIds.has(card.id)) || null;
  }, [session.cards, session.answered]);

  const answerCard = useCallback(
    async ({ cardId, answer }) => {
      if (!session.sessionId || !cardId) return null;
      setSubmitting(true);
      setError(null);
      try {
        const response = await vocabularyGamesApi.speedChallengeAnswer({
          token,
          sessionId: session.sessionId,
          cardId,
          answer,
        });
        if (response?.session) {
          setSession({
            sessionId: response.session.sessionId,
            cards: response.session.cards || session.cards,
            answered: response.session.answered || session.answered,
            durationMs: response.session.durationMs || session.durationMs,
            state: response.session.state || session.state,
            result: response.session.result || session.result,
          });
        }
        return response;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [
      session.sessionId,
      session.cards,
      session.answered,
      session.durationMs,
      session.state,
      session.result,
      token,
    ]
  );

  const finishGame = useCallback(
    async ({ elapsedMs } = {}) => {
      if (!session.sessionId) return null;
      setSubmitting(true);
      setError(null);
      clearTimer();
      setIsRunning(false);
      try {
        const response = await vocabularyGamesApi.speedChallengeFinish({
          token,
          sessionId: session.sessionId,
          elapsedMs,
        });
        if (response?.session) {
          setSession({
            sessionId: response.session.sessionId,
            cards: response.session.cards || session.cards,
            answered: response.session.answered || session.answered,
            durationMs: response.session.durationMs || session.durationMs,
            state: response.session.state || session.state,
            result: response.session.result || session.result,
          });
        }
        return response;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [
      session.sessionId,
      session.cards,
      session.answered,
      session.durationMs,
      session.state,
      session.result,
      token,
      clearTimer,
    ]
  );

  useEffect(() => {
    if (autoStart) {
      startGame();
    }
    return () => {
      clearTimer();
    };
  }, [autoStart, startGame, clearTimer]);

  useEffect(() => {
    if (timeRemaining === 0 && session.state.status === "active") {
      finishGame({ elapsedMs: session.durationMs });
    }
  }, [timeRemaining, session.state.status, finishGame, session.durationMs]);

  const progress = useMemo(() => {
    const total = session.cards.length;
    const answeredCount = session.answered.length;
    return {
      total,
      answered: answeredCount,
      percent: total > 0 ? Math.round((answeredCount / total) * 100) : 0,
    };
  }, [session.cards.length, session.answered.length]);

  const timeFormatted = useMemo(() => {
    const seconds = Math.max(0, Math.ceil(timeRemaining / 1000));
    const mm = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const ss = (seconds % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
  }, [timeRemaining]);

  const isCompleted = session.state.status === "completed";

  return {
    loading,
    submitting,
    error,
    session,
    sessionMeta,
    activeCard,
    progress,
    answerCard,
    finishGame,
    startGame,
    resetState,
    timeRemaining,
    timeFormatted,
    isRunning,
    isCompleted,
  };
}
