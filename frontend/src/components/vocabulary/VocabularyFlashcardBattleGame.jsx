import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import useFlashcardBattle from "../../hooks/useFlashcardBattle";
import { RefreshIcon, FireIcon } from "../icons";

const VocabularyFlashcardBattleGame = ({ category }) => {
  const {
    loading,
    submitting,
    error,
    session,
    sessionMeta,
    currentRound,
    progress,
    startGame,
    answerRound,
    feedback,
    setFeedback,
    isCompleted,
    victory,
  } = useFlashcardBattle({ autoStart: true, category });

  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (feedback) {
      const text =
        feedback === "success" ? "Vuruş başarılı!" : "Rakip karşılık verdi";
      setMessage({ type: feedback === "success" ? "success" : "error", text });
      const timeout = setTimeout(() => {
        setMessage(null);
        setFeedback(null);
      }, 2200);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [feedback, setFeedback]);

  const playerHp = session.hp?.player ?? 100;
  const opponentHp = session.hp?.opponent ?? 100;

  const playerHpPercent = useMemo(
    () => Math.max(0, Math.min(100, Math.round(playerHp))),
    [playerHp]
  );
  const opponentHpPercent = useMemo(
    () => Math.max(0, Math.min(100, Math.round(opponentHp))),
    [opponentHp]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!currentRound || !answer) return;
    await answerRound({ roundId: currentRound.id, answer });
    setAnswer("");
  };

  const handleRestart = () => {
    setAnswer("");
    setMessage(null);
    startGame();
  };

  const dailyGoal = sessionMeta?.dailyGoal ?? null;
  const dailyProgress = sessionMeta?.dailyProgress ?? 0;
  const xpEarned = session.result?.xpEarned || 0;

  const formatNumber = (value, fallback = "0") =>
    typeof value === "number" && Number.isFinite(value)
      ? value.toLocaleString("tr-TR")
      : fallback;

  const progressAnswered = progress?.answered ?? 0;
  const progressTotal = progress?.total ?? 0;
  const progressPercent = Math.min(Math.max(progress?.percent ?? 0, 0), 100);
  const currentRoundNumber = progressTotal
    ? Math.min(progressAnswered + 1, progressTotal)
    : progressAnswered + 1;

  const correctCount = session.result?.correct ?? 0;
  const incorrectCount = session.result?.incorrect ?? 0;
  const score = session.result?.score ?? 0;

  const scoreboardStats = useMemo(
    () => [
      {
        id: "correct",
        label: "Doğru",
        value: formatNumber(correctCount, "0"),
      },
      {
        id: "incorrect",
        label: "Yanlış",
        value: formatNumber(incorrectCount, "0"),
      },
      {
        id: "xp",
        label: "XP",
        value: formatNumber(xpEarned, "0"),
      },
    ],
    [correctCount, incorrectCount, xpEarned]
  );

  const headerStats = useMemo(
    () => [
      {
        id: "rounds",
        label: "Turlar",
        value: `${formatNumber(progressAnswered, "0")} / ${formatNumber(
          progressTotal,
          "—"
        )}`,
        description: `%${formatNumber(progressPercent, "0")}`,
      },
      {
        id: "player",
        label: "Sen",
        value: `${formatNumber(playerHpPercent, "0")}%`,
        description: "HP durumu",
      },
      {
        id: "opponent",
        label: "Rakip",
        value: `${formatNumber(opponentHpPercent, "0")}%`,
        description: "HP durumu",
      },
      {
        id: "xp",
        label: "XP",
        value: formatNumber(xpEarned, "0"),
        description:
          dailyGoal != null
            ? `${formatNumber(dailyProgress, "0")} / ${formatNumber(
                dailyGoal,
                "0"
              )} hedef`
            : "Bonus mücadele",
      },
    ],
    [
      dailyGoal,
      dailyProgress,
      opponentHpPercent,
      playerHpPercent,
      progressAnswered,
      progressPercent,
      progressTotal,
      xpEarned,
    ]
  );

  const roundBadgeText = isCompleted
    ? victory
      ? "Zafer! 🎉"
      : "Mücadele tamamlandı"
    : `Tur ${formatNumber(currentRoundNumber, "0")} / ${formatNumber(
        progressTotal,
        "—"
      )}`;

  const headerContent = (
    <header className="vocabulary-panel__header">
      <div className="vocabulary-panel__intro">
        <span className="chip chip--accent">Kart dövüşü</span>
        <h2 className="vocabulary-panel__title">Kart Dövüşü</h2>
        <p className="vocabulary-panel__subtitle">
          Beş tur süren bu mücadelede doğru cevaplar rakibine hasar verir.
        </p>
        <div className="vocabulary-panel__badge-row" aria-live="polite">
          <span className="badge">{roundBadgeText}</span>
          <span className="badge badge--muted">
            Skor {formatNumber(score, "0")}
          </span>
          <button
            type="button"
            className="icon-button"
            onClick={handleRestart}
            disabled={loading || submitting}
            title="Yeni mücadele"
            aria-label="Yeni mücadele başlat"
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
    <section className="surface-card card-content vocabulary-panel vocabulary-panel--battle">
      {headerContent}

      {error && (
        <div className="alert alert--error">
          {error.message || "Kart dövüşü başlatılamadı"}
        </div>
      )}

      <div className="vocabulary-panel__layout">
        <div className="vocabulary-panel__primary">
          <section className="vocabulary-panel__section" aria-live="polite">
            {message && (
              <div
                className={`alert alert--${
                  message.type === "success" ? "success" : "warning"
                }`}
                style={{ marginBottom: "1rem" }}
              >
                {message.text}
              </div>
            )}

            {loading ? (
              <div className="vocabulary-panel__placeholder">
                Mücadele hazırlanıyor...
              </div>
            ) : currentRound && !isCompleted ? (
              <form
                onSubmit={handleSubmit}
                className="vocabulary-battle__stage"
              >
                <div className="vocabulary-battle__card">
                  <header>
                    <span
                      className="vocabulary-battle__card-icon"
                      aria-hidden="true"
                    >
                      <FireIcon fontSize="inherit" />
                    </span>
                    <div>
                      <span className="text-xs text-secondary">
                        Senin kartın
                      </span>
                      <h3>{currentRound.player.term}</h3>
                    </div>
                  </header>
                  <p className="text-sm text-secondary">
                    Türkçe karşılığını yaz ve Enter&apos;a bas.
                  </p>
                  <input
                    type="text"
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    placeholder="Türkçe çeviriyi yaz"
                    disabled={submitting}
                  />
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={submitting || !answer.trim()}
                  >
                    Saldır
                  </button>
                </div>
                <aside className="vocabulary-battle__opponent">
                  <h4>Rakip kartı</h4>
                  <p>
                    <strong>{currentRound.opponent.term}</strong>
                  </p>
                  <p className="text-xs text-secondary">
                    Doğru cevap veremezsen rakip saldırır.
                  </p>
                </aside>
              </form>
            ) : (
              <div
                className={`vocabulary-battle__result${
                  victory ? " is-victory" : " is-defeat"
                }`}
              >
                <h3>{victory ? "Zafer!" : "Kaybettin"}</h3>
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
                  Tekrar savaş
                </button>
              </div>
            )}
          </section>
        </div>

        <aside className="vocabulary-panel__secondary">
          <section className="vocabulary-panel__section">
            <h3 className="vocabulary-panel__section-title">HP durumu</h3>
            <div className="vocabulary-battle__hp">
              <div className="vocabulary-battle__hp-track">
                <span>Sen</span>
                <div className="vocabulary-battle__hp-bar">
                  <span style={{ width: `${playerHpPercent}%` }} />
                </div>
                <strong>{formatNumber(playerHpPercent, "0")}%</strong>
              </div>
              <div className="vocabulary-battle__hp-track">
                <span>Rakip</span>
                <div className="vocabulary-battle__hp-bar is-opponent">
                  <span style={{ width: `${opponentHpPercent}%` }} />
                </div>
                <strong>{formatNumber(opponentHpPercent, "0")}%</strong>
              </div>
            </div>
          </section>

          <section className="vocabulary-panel__section">
            <h3 className="vocabulary-panel__section-title">Tur ilerlemesi</h3>
            <div className="vocabulary-battle__progress">
              <div className="vocabulary-battle__progress-bar">
                <span style={{ width: `${progressPercent}%` }} />
              </div>
              <span className="text-xs text-secondary">
                {formatNumber(progressAnswered, "0")} /{" "}
                {formatNumber(progressTotal, "—")} tur
              </span>
            </div>
          </section>

          <section className="vocabulary-panel__section">
            <h3 className="vocabulary-panel__section-title">Skor özeti</h3>
            <div className="vocabulary-panel__stats">
              {scoreboardStats.map((stat) => (
                <article key={stat.id} className="vocabulary-panel__stat">
                  <header>
                    <span className="label">{stat.label}</span>
                  </header>
                  <strong>{stat.value}</strong>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
};

VocabularyFlashcardBattleGame.propTypes = {
  category: PropTypes.string,
};

VocabularyFlashcardBattleGame.defaultProps = {
  category: null,
};

export default VocabularyFlashcardBattleGame;
