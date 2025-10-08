import React, { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import useSpeedChallengeGame from "../../hooks/useSpeedChallengeGame";
import { BoltIcon, RefreshIcon } from "../icons";

const VocabularySpeedChallengeGame = ({ category }) => {
  const {
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
    timeFormatted,
    timeRemaining,
    isRunning,
    isCompleted,
  } = useSpeedChallengeGame({ autoStart: true, category });

  const [feedback, setFeedback] = useState(null);

  const dailyGoal = sessionMeta?.dailyGoal ?? null;
  const dailyProgress = sessionMeta?.dailyProgress ?? 0;

  const formatNumber = (value, fallback = "0") =>
    typeof value === "number" && Number.isFinite(value)
      ? value.toLocaleString("tr-TR")
      : fallback;

  const handleAnswer = useCallback(
    async (option) => {
      if (!activeCard) return;
      try {
        const response = await answerCard({
          cardId: activeCard.id,
          answer: option,
        });
        if (response?.success) {
          setFeedback({ type: "success", text: "Doğru!" });
        } else {
          setFeedback({ type: "error", text: "Yanlış cevap" });
        }
      } catch (err) {
        setFeedback({
          type: "error",
          text: err.message || "Cevap gönderilemedi",
        });
      }
    },
    [activeCard, answerCard]
  );

  const handleRestart = () => {
    setFeedback(null);
    startGame();
  };

  const handleFinish = () => {
    setFeedback(null);
    finishGame({ elapsedMs: session.durationMs - timeRemaining });
  };

  useEffect(() => {
    if (feedback) {
      const timeout = setTimeout(() => setFeedback(null), 2000);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [feedback]);

  const answeredCount = session?.answered?.length || 0;
  const totalCards = session?.cards?.length || 0;
  const accuracy = totalCards
    ? Math.round(((session.result?.correct || 0) / totalCards) * 100)
    : 0;
  const score = session?.result?.score ?? 0;
  const combo = session?.result?.combo ?? 0;
  const xpEarned =
    session?.result?.xpEarned ??
    sessionMeta?.xpEarned ??
    session?.xpEarned ??
    0;
  const correctCount = session?.result?.correct ?? 0;
  const incorrectCount = session?.result?.incorrect ?? 0;
  const progressPercent = Math.min(Math.max(progress?.percent ?? 0, 0), 100);
  const progressAnswered = progress?.answered ?? answeredCount;
  const progressTotal = progress?.total ?? totalCards;

  const headerStats = React.useMemo(() => {
    const timeState = isCompleted
      ? "Süre doldu"
      : isRunning
      ? "Sayaç çalışıyor"
      : "Duraklatıldı";

    const items = [
      {
        id: "timer",
        label: "Süre",
        value: timeFormatted || "00:00",
        description: timeState,
      },
      {
        id: "score",
        label: "Skor",
        value: formatNumber(score, "0"),
        description: `Kombo ${formatNumber(combo, "0")}`,
      },
      {
        id: "accuracy",
        label: "Doğruluk",
        value: `%${formatNumber(accuracy, "0")}`,
        description: `${formatNumber(correctCount, "0")} doğru · ${formatNumber(
          incorrectCount,
          "0"
        )} yanlış`,
      },
    ];

    items.push({
      id: "goal",
      label: "Günlük",
      value:
        dailyGoal != null
          ? `${formatNumber(dailyProgress, "0")} / ${formatNumber(
              dailyGoal,
              "0"
            )}`
          : "—",
      description: dailyGoal != null ? "Hedef yolunda" : "Serbest çalışma modu",
    });

    return items;
  }, [
    accuracy,
    combo,
    correctCount,
    dailyGoal,
    dailyProgress,
    incorrectCount,
    isCompleted,
    isRunning,
    score,
    timeFormatted,
  ]);

  const headerContent = (
    <header className="vocabulary-panel__header">
      <div className="vocabulary-panel__intro">
        <span className="chip chip--accent">Hız modu</span>
        <h2 className="vocabulary-panel__title">Zaman Karşı Yarış</h2>
        <p className="vocabulary-panel__subtitle">
          30 saniyede mümkün olduğunca fazla kelime eşleştir, doğru cevaplarla
          skoru yükselt.
        </p>
        <div className="vocabulary-panel__badge-row" aria-live="polite">
          <span className="badge">
            Yanıtlanan {formatNumber(answeredCount, "0")} /{" "}
            {formatNumber(totalCards, "—")}
          </span>
          <span className="badge badge--muted">
            XP {formatNumber(xpEarned, "0")}
          </span>
          <button
            type="button"
            className="icon-button"
            onClick={handleRestart}
            disabled={loading || submitting}
            title="Yeniden başlat"
            aria-label="Oyunu yeniden başlat"
          >
            <RefreshIcon fontSize="inherit" />
          </button>
        </div>
      </div>
      {headerStats.length > 0 && (
        <div className="vocabulary-panel__stats">
          {headerStats.map((stat) => (
            <article key={stat.id} className="vocabulary-panel__stat">
              <header>
                <span className="label">{stat.label}</span>
              </header>
              <strong>{stat.value}</strong>
              {stat.description && <p>{stat.description}</p>}
            </article>
          ))}
        </div>
      )}
    </header>
  );

  return (
    <section className="surface-card card-content vocabulary-panel vocabulary-panel--speed">
      {headerContent}

      {error && (
        <div className="alert alert--error">
          {error.message || "Zaman Karşı Yarış başlatılamadı"}
        </div>
      )}

      <div className="vocabulary-panel__layout">
        <div className="vocabulary-panel__primary">
          <section className="vocabulary-panel__section" aria-live="polite">
            {feedback && (
              <div
                className={`alert alert--${
                  feedback.type === "success" ? "success" : "warning"
                }`}
              >
                {feedback.text}
              </div>
            )}

            {loading ? (
              <div className="vocabulary-panel__placeholder">
                Kartlar hazırlanıyor...
              </div>
            ) : activeCard && !isCompleted ? (
              <div className="vocabulary-speed-challenge__card">
                <div className="vocabulary-speed-challenge__card-header">
                  <span
                    className="vocabulary-speed-challenge__card-icon"
                    aria-hidden="true"
                  >
                    <BoltIcon fontSize="inherit" />
                  </span>
                  <div>
                    <span className="text-xs text-secondary">Kelime</span>
                    <h3>{activeCard.term}</h3>
                  </div>
                </div>
                <div className="vocabulary-speed-challenge__options">
                  {activeCard.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className="vocabulary-speed-challenge__option"
                      onClick={() => handleAnswer(option)}
                      disabled={submitting}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="vocabulary-speed-challenge__complete">
                <h3>{isCompleted ? "Süre doldu!" : "Hazırsın"}</h3>
                <p className="text-sm text-secondary">
                  {formatNumber(correctCount, "0")} doğru,{" "}
                  {formatNumber(incorrectCount, "0")} yanlış, skor{" "}
                  {formatNumber(score, "0")}.
                </p>
                <button
                  type="button"
                  className="primary-button"
                  onClick={handleRestart}
                >
                  Tekrar oyna
                </button>
              </div>
            )}
          </section>
        </div>

        <aside className="vocabulary-panel__secondary">
          <section className="vocabulary-panel__section">
            <h3 className="vocabulary-panel__section-title">Oturum özeti</h3>
            <div className="vocabulary-speed-challenge__stats">
              <div className="vocabulary-speed-challenge__stat">
                <span className="label">Yanıtlanan</span>
                <strong>
                  {formatNumber(answeredCount, "0")} /{" "}
                  {formatNumber(totalCards, "—")}
                </strong>
              </div>
              <div className="vocabulary-speed-challenge__stat">
                <span className="label">Kombo</span>
                <strong>{formatNumber(combo, "0")}</strong>
              </div>
              <div className="vocabulary-speed-challenge__stat">
                <span className="label">XP</span>
                <strong>{formatNumber(xpEarned, "0")}</strong>
              </div>
            </div>
          </section>

          <section className="vocabulary-panel__section">
            <h3 className="vocabulary-panel__section-title">İlerleme</h3>
            <div className="vocabulary-speed-challenge__progress">
              <div className="vocabulary-speed-challenge__progress-bar">
                <span style={{ width: `${progressPercent}%` }} />
              </div>
              <span className="text-xs text-secondary">
                {formatNumber(progressAnswered, "0")} /{" "}
                {formatNumber(progressTotal, "—")} kart oynandı
              </span>
            </div>
          </section>

          <section className="vocabulary-panel__section">
            <h3 className="vocabulary-panel__section-title">Kontroller</h3>
            <p className="vocabulary-panel__section-subtitle">
              Süreyi erken bitirerek oturumu sonlandırabilirsin.
            </p>
            <div className="vocabulary-panel__actions">
              <button
                type="button"
                className="secondary-button"
                onClick={handleFinish}
                disabled={isCompleted || submitting || !isRunning}
              >
                Süreyi bitir
              </button>
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
};

VocabularySpeedChallengeGame.propTypes = {
  category: PropTypes.string,
};

VocabularySpeedChallengeGame.defaultProps = {
  category: null,
};

export default VocabularySpeedChallengeGame;
