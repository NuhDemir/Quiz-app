import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { vocabularyGamesApi } from "../utils/endpoints";

const initialSession = {
  sessionId: null,
  rounds: [],
  answers: [],
  hp: { player: 100, opponent: 100 },
  currentRound: 0,
  state: { status: "idle", metadata: {} },
  result: {
    correct: 0,
    incorrect: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    xpEarned: 0,
  },
};

export default function useFlashcardBattle({
  autoStart = false,
  category,
} = {}) {
  const token = useSelector((state) => state.auth?.token);
  const [session, setSession] = useState(initialSession);
  const [sessionMeta, setSessionMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const resetState = useCallback(() => {
    setSession(initialSession);
    setSessionMeta(null);
    setFeedback(null);
    setError(null);
  }, []);

  const startGame = useCallback(async () => {
    if (!token) {
      setError(new Error("Oturum açmak gerekli"));
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await vocabularyGamesApi.flashcardBattleStart({
        token,
        category,
      });
      if (!response?.session) {
        resetState();
        return response;
      }
      setSession({
        sessionId: response.session.sessionId,
        rounds: response.session.rounds || [],
        answers: response.session.answers || [],
        hp: response.session.hp || initialSession.hp,
        currentRound: response.session.currentRound || 0,
        state: response.session.state || initialSession.state,
        result: response.session.result || initialSession.result,
      });
      setSessionMeta(response.sessionMeta || null);
      setFeedback(null);
      return response;
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token, category, resetState]);

  const answerRound = useCallback(
    async ({ roundId, answer }) => {
      if (!session.sessionId) return null;
      setSubmitting(true);
      setError(null);
      try {
        const response = await vocabularyGamesApi.flashcardBattleAnswer({
          token,
          sessionId: session.sessionId,
          roundId,
          answer,
        });
        if (response?.session) {
          setSession({
            sessionId: response.session.sessionId,
            rounds: response.session.rounds || session.rounds,
            answers: response.session.answers || session.answers,
            hp: response.session.hp || session.hp,
            currentRound: response.session.currentRound ?? session.currentRound,
            state: response.session.state || session.state,
            result: response.session.result || session.result,
          });
          setFeedback(response.success ? "success" : "failure");
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
      session.rounds,
      session.answers,
      session.hp,
      session.currentRound,
      session.state,
      session.result,
      token,
    ]
  );

  useEffect(() => {
    if (autoStart) {
      startGame();
    }
  }, [autoStart, startGame]);

  const currentRoundData = useMemo(() => {
    const answeredRounds = new Set(session.answers.map((item) => item.roundId));
    return (
      session.rounds.find((round) => !answeredRounds.has(round.id)) || null
    );
  }, [session.rounds, session.answers]);

  const totalRounds = session.rounds.length;
  const answeredCount = session.answers.length;
  const victory = session.state?.metadata?.victory || false;
  const isCompleted = session.state?.status === "completed";

  const progress = useMemo(
    () => ({
      total: totalRounds,
      answered: answeredCount,
      percent:
        totalRounds > 0 ? Math.round((answeredCount / totalRounds) * 100) : 0,
    }),
    [totalRounds, answeredCount]
  );

  return {
    loading,
    submitting,
    error,
    session,
    sessionMeta,
    currentRound: currentRoundData,
    progress,
    startGame,
    answerRound,
    resetState,
    feedback,
    setFeedback,
    isCompleted,
    victory,
  };
}
