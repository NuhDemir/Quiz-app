import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import VocabularyFlashcard from "./VocabularyFlashcard";
import { TrophyIcon, TargetIcon } from "../icons";

const learnButtons = [
  {
    id: "again",
    label: "Tekrar Gerek",
    description: "Kartı tekrar sıraya al",
    variant: "warning",
    shortcut: "1",
  },
  {
    id: "good",
    label: "Öğrendim",
    description: "Kartı tamamladım",
    variant: "primary",
    shortcut: "2",
  },
];

const shortcutLabels = {
  again: "Tekrar Gerek",
  good: "Öğrendim",
  skip: "Pas",
};

const VocabularyLearnGame = ({
  card,
  queueLength,
  loading,
  error,
  stats = {},
  lastResult,
  isSessionComplete,
  onGrade,
  onSkip,
  onRestart,
  sessionMeta = {},
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [cardKey, setCardKey] = useState(null);
  const [learnedHistory, setLearnedHistory] = useState([]);
  const [isReplayActive, setIsReplayActive] = useState(false);
  const [replayCardIndex, setReplayCardIndex] = useState(0);
  const [isReplayRevealed, setIsReplayRevealed] = useState(false);

  const activeKey = card?.key || card?.progressId || card?.word?._id;

  useEffect(() => {
    if (!activeKey || activeKey === cardKey) return;
    setIsRevealed(false);
    setCardKey(activeKey);
  }, [activeKey, cardKey]);

  useEffect(() => {
    if (!loading && stats.reviewed === 0) {
      setLearnedHistory([]);
      setIsReplayActive(false);
      setReplayCardIndex(0);
      setIsReplayRevealed(false);
    }
  }, [loading, stats.reviewed]);

  const remainingCount = Number.isFinite(queueLength) ? queueLength : 0;
  const statsTotal = stats.total || 0;
  const statsCorrect = stats.correct || 0;
  const statsLapses = stats.lapses || 0;
  const statsSkipped = stats.skipped || 0;
  const reviewed = stats.reviewed || 0;

  const total = useMemo(
    () => Math.max(statsTotal, reviewed + remainingCount),
    [statsTotal, reviewed, remainingCount]
  );

  const progressPercent = total > 0 ? Math.round((reviewed / total) * 100) : 0;
  const displayPosition = Math.min(reviewed + (card ? 1 : 0), total || 1);

  const rewardXp =
    lastResult?.payload?.reward?.xp ??
    lastResult?.payload?.xpAwarded ??
    sessionMeta?.lastAward?.xp ??
    null;

  const resultMessage = lastResult?.success
    ? `${shortcutLabels[lastResult.rating] || ""} olarak işaretlendi${
        rewardXp ? ` · +${rewardXp} XP` : ""
      }`
    : lastResult?.error
    ? lastResult.error.message || "Kart kaydedilemedi"
    : null;

  const sessionXp = sessionMeta?.xpEarned || 0;
  const sessionGoal = sessionMeta?.dailyGoal ?? null;
  const sessionProgress = sessionMeta?.dailyProgress ?? reviewed;
  const sessionGoalPct =
    sessionGoal && sessionGoal > 0
      ? Math.min(100, Math.round((sessionProgress / sessionGoal) * 100))
      : sessionProgress > 0
      ? 100
      : 0;

  const replayCard = learnedHistory[replayCardIndex] || null;
  const hasReplayHistory = learnedHistory.length > 0;
  const replayWord = replayCard?.word || null;
  const replayPosition = hasReplayHistory ? replayCardIndex + 1 : 0;
  const replayTotal = learnedHistory.length;

  const visibleHistory = useMemo(
    () => learnedHistory.slice(0, 12),
    [learnedHistory]
  );

  useEffect(() => {
    if (!isReplayActive) return;
    if (!replayCard) {
      setIsReplayActive(false);
      setReplayCardIndex(0);
      setIsReplayRevealed(false);
    } else {
      setIsReplayRevealed(false);
    }
  }, [isReplayActive, replayCard]);

  useEffect(() => {
    if (learnedHistory.length === 0) {
      setIsReplayActive(false);
      setReplayCardIndex(0);
      setIsReplayRevealed(false);
    }
  }, [learnedHistory.length]);

  const formatNumber = (value, fallback = "0") =>
    typeof value === "number" && Number.isFinite(value)
      ? value.toLocaleString("tr-TR")
      : fallback;

  const formatRelativeTime = useCallback((timestamp) => {
    if (!timestamp) return "";
    const now = Date.now();
    const diffMs = now - timestamp;

    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diffMs < 45 * 1000) return "Az önce";
    if (diffMs < 90 * 1000) return "1 dk önce";
    if (diffMs < 45 * minute) return `${Math.round(diffMs / minute)} dk önce`;
    if (diffMs < 90 * minute) return "1 saat önce";
    if (diffMs < 22 * hour) return `${Math.round(diffMs / hour)} saat önce`;
    if (diffMs < 36 * hour) return "1 gün önce";
    if (diffMs < 25 * day) return `${Math.round(diffMs / day)} gün önce`;
    return new Date(timestamp).toLocaleDateString("tr-TR");
  }, []);

  const headerStats = useMemo(() => {
    const items = [
      {
        id: "progress",
        label: "İlerleme",
        value: `${formatNumber(displayPosition, "0")} / ${
          total > 0 ? formatNumber(total, "—") : "—"
        }`,
        description:
          remainingCount > 0
            ? `${formatNumber(remainingCount, "0")} kart kaldı`
            : card
            ? "Son kart 🎯"
            : "Yeni kart bekleniyor",
      },
      {
        id: "reviewed",
        label: "Çalışılan",
        value: formatNumber(reviewed, "0"),
        description: `Doğru: ${formatNumber(statsCorrect, "0")}`,
      },
    ];

    if (sessionGoal != null) {
      items.push({
        id: "goal",
        label: "Günlük hedef",
        value: `${formatNumber(sessionProgress, "0")} / ${formatNumber(
          sessionGoal,
          "0"
        )}`,
        description: `%${formatNumber(sessionGoalPct, "0")}`,
      });
    } else {
      items.push({
        id: "xp",
        label: "Oturum XP",
        value: formatNumber(sessionXp, "0"),
        description:
          rewardXp != null
            ? `Son kart +${formatNumber(rewardXp, "0")} XP`
            : "Öğrenmeye devam!",
      });
    }

    return items;
  }, [
    card,
    displayPosition,
    total,
    remainingCount,
    reviewed,
    statsCorrect,
    sessionGoal,
    sessionProgress,
    sessionGoalPct,
    sessionXp,
    rewardXp,
  ]);

  const headerSubtitle = isSessionComplete
    ? "Yeni desteye hazır olduğunda tekrar başlayabilirsin."
    : "Kartı çevir, kelimeyi öğren ve kendini değerlendir.";

  const queueBadgeText = isSessionComplete
    ? "Yeni desten hazır"
    : remainingCount > 0
    ? `${formatNumber(remainingCount, "0")} kart kaldı`
    : card
    ? "Son kart 🎯"
    : "Yeni kart bekleniyor";

  const headerContent = (
    <header className="vocabulary-panel__header">
      <div className="vocabulary-panel__intro">
        <span className="chip chip--accent">Öğrenme modu</span>
        <h2 className="vocabulary-panel__title">Kelime kartı oyunu</h2>
        <p className="vocabulary-panel__subtitle">{headerSubtitle}</p>
        <div className="vocabulary-panel__badge-row" aria-live="polite">
          <span className="badge">
            Kart {formatNumber(displayPosition, "0")} /{" "}
            {total > 0 ? formatNumber(total, "—") : "—"}
          </span>
          <span className="badge badge--muted">{queueBadgeText}</span>
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

  const word = card?.word || null;

  const handleReveal = useCallback(() => {
    setIsRevealed(true);
  }, []);

  const handleGrade = useCallback(
    (ratingId) => {
      if (card) {
        if (ratingId === "good" && card.word) {
          const wordData = {
            ...card.word,
            examples: Array.isArray(card.word?.examples)
              ? [...card.word.examples]
              : [],
            category: card.word?.category
              ? { ...card.word.category }
              : undefined,
          };

          setLearnedHistory((prev) => {
            const entry = {
              key: card.key,
              word: wordData,
              capturedAt: Date.now(),
            };
            const withoutCurrent = prev.filter((item) => item.key !== card.key);
            return [entry, ...withoutCurrent].slice(0, 12);
          });
        } else if (ratingId === "again") {
          setLearnedHistory((prev) =>
            prev.filter((item) => item.key !== card.key)
          );
        }
      }

      onGrade?.(ratingId);
      setIsRevealed(false);
    },
    [card, onGrade]
  );

  const handleSkip = useCallback(() => {
    onSkip?.();
    setIsRevealed(false);
  }, [onSkip]);

  const toggleReplayReveal = useCallback(() => {
    setIsReplayRevealed((prev) => !prev);
  }, []);

  const handleStartReplay = useCallback(
    (index = 0) => {
      if (!learnedHistory.length) return;
      const safeIndex = Math.min(Math.max(index, 0), learnedHistory.length - 1);
      setReplayCardIndex(safeIndex);
      setIsReplayActive(true);
      setIsReplayRevealed(false);
    },
    [learnedHistory.length]
  );

  const handleStopReplay = useCallback(() => {
    setIsReplayActive(false);
    setIsReplayRevealed(false);
  }, []);

  const handleReplayNext = useCallback(() => {
    if (!learnedHistory.length) return;
    setReplayCardIndex((prev) => (prev + 1) % learnedHistory.length);
  }, [learnedHistory.length]);

  const handleReplayPrev = useCallback(() => {
    if (!learnedHistory.length) return;
    setReplayCardIndex(
      (prev) => (prev - 1 + learnedHistory.length) % learnedHistory.length
    );
  }, [learnedHistory.length]);

  const handleSelectReplayCard = useCallback(
    (index) => {
      if (!learnedHistory.length) return;
      const safeIndex = Math.min(Math.max(index, 0), learnedHistory.length - 1);
      setReplayCardIndex(safeIndex);
      setIsReplayActive(true);
      setIsReplayRevealed(false);
    },
    [learnedHistory.length]
  );

  const handleClearReplay = useCallback(() => {
    setLearnedHistory([]);
    setIsReplayActive(false);
    setReplayCardIndex(0);
    setIsReplayRevealed(false);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleKey = (event) => {
      if (!card) return;

      if (!isRevealed && (event.key === " " || event.code === "Space")) {
        event.preventDefault();
        setIsRevealed(true);
        return;
      }

      if (!isRevealed) return;

      const shortcutButton = learnButtons.find(
        (button) => button.shortcut === event.key
      );
      if (shortcutButton) {
        event.preventDefault();
        handleGrade(shortcutButton.id);
        return;
      }

      if (event.key === "0") {
        event.preventDefault();
        handleSkip();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [card, handleGrade, handleSkip, isRevealed]);

  if (error) {
    return (
      <section className="surface-card card-content vocabulary-panel vocabulary-panel--learn">
        {headerContent}
        <div className="alert alert--error">
          {error.message || "Kelime oyunu yüklenemedi"}
        </div>
      </section>
    );
  }

  if (loading && !card) {
    return (
      <section className="surface-card card-content vocabulary-panel vocabulary-panel--learn">
        {headerContent}
        <div className="vocabulary-panel__placeholder">
          Kartlar hazırlanıyor...
        </div>
      </section>
    );
  }

  if (isSessionComplete) {
    return (
      <section className="surface-card card-content vocabulary-panel vocabulary-panel--learn">
        {headerContent}
        <section className="vocabulary-panel__section">
          <h3 className="vocabulary-panel__section-title">
            Tebrikler! Yeni kartlar tamamlandı 🎉
          </h3>
          <p className="vocabulary-panel__section-subtitle">
            {reviewed} yeni kartı keşfettin. İstersen yeni bir deste çağırıp
            pratiğe devam edebilirsin.
          </p>
          <div className="vocabulary-review__summary">
            <div>
              <span className="vocabulary-review__summary-label">
                Öğrenilen
              </span>
              <strong>{formatNumber(statsCorrect, "0")}</strong>
            </div>
            <div>
              <span className="vocabulary-review__summary-label">Tekrar</span>
              <strong>{formatNumber(statsLapses, "0")}</strong>
            </div>
            <div>
              <span className="vocabulary-review__summary-label">XP</span>
              <strong>{formatNumber(sessionXp, "0")}</strong>
            </div>
          </div>
          <div className="vocabulary-panel__actions">
            <button
              type="button"
              className="primary-button"
              onClick={onRestart}
            >
              Yeni kartlar getir
            </button>
          </div>
        </section>
      </section>
    );
  }

  if (!card) {
    return (
      <section className="surface-card card-content vocabulary-panel vocabulary-panel--learn">
        {headerContent}
        <div className="vocabulary-panel__placeholder">
          Tüm yeni kartları oynadın! Bir süre sonra yeni kelimeler için geri
          dön.
        </div>
      </section>
    );
  }

  return (
    <section className="surface-card card-content vocabulary-panel vocabulary-panel--learn">
      {headerContent}

      <div className="vocabulary-panel__layout">
        <div className="vocabulary-panel__primary">
          <VocabularyFlashcard
            term={word?.term}
            translation={word?.translation}
            definition={word?.definition}
            examples={word?.examples}
            notes={word?.notes}
            isFlipped={isRevealed}
            onFlip={setIsRevealed}
            hint={{
              front: "Cevabı görmek için çevir",
              back: "Kartı değerlendirerek sıradaki kelimeye geç",
            }}
            badges={[
              word?.level
                ? { id: "level", label: word.level, tone: "muted" }
                : null,
              word?.category?.name
                ? {
                    id: "category",
                    label: word.category.name,
                    tone: "primary",
                  }
                : null,
            ].filter(Boolean)}
          />

          <footer className="vocabulary-review__actions">
            {!isRevealed ? (
              <>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleSkip}
                >
                  Pas geç (0)
                </button>
                <button
                  type="button"
                  className="primary-button"
                  onClick={handleReveal}
                >
                  Kartı göster (Boşluk)
                </button>
              </>
            ) : (
              <div className="vocabulary-review__ratings">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleSkip}
                >
                  Pas geç (0)
                </button>
                {learnButtons.map((button) => (
                  <button
                    key={button.id}
                    type="button"
                    className={`review-rating-button review-rating-button--${button.variant}`}
                    onClick={() => handleGrade(button.id)}
                  >
                    <span className="review-rating-button__label">
                      {button.label}
                    </span>
                    <span className="review-rating-button__meta">
                      {button.description} · {button.shortcut}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </footer>
        </div>

        <aside className="vocabulary-panel__secondary">
          <section className="vocabulary-panel__section" aria-live="polite">
            <h3 className="vocabulary-panel__section-title">Oturum özeti</h3>
            <div className="vocabulary-review__progress">
              <div
                className="vocabulary-review__progress-bar"
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <span style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="vocabulary-review__progress-stats">
                <span>Öğrenilen: {formatNumber(statsCorrect, "0")}</span>
                <span>Tekrar: {formatNumber(statsLapses, "0")}</span>
                <span>Pas: {formatNumber(statsSkipped, "0")}</span>
              </div>
            </div>
          </section>

          <section
            className="vocabulary-panel__section vocabulary-replay"
            aria-live="polite"
          >
            <div className="vocabulary-replay__header">
              <h3 className="vocabulary-panel__section-title">
                Tekrar çalışma prensibi
              </h3>
              {hasReplayHistory && (
                <span className="badge badge--muted">
                  {formatNumber(replayTotal, "0")} kart
                </span>
              )}
            </div>

            {!hasReplayHistory && (
              <p className="vocabulary-panel__section-subtitle vocabulary-replay__empty">
                Kartları &ldquo;Öğrendim&rdquo; olarak işaretlediğinde, çalışma
                prensibine göre tekrar edebileceğin bir mini deste burada
                oluşacak.
              </p>
            )}

            {hasReplayHistory && (
              <>
                <div
                  className="vocabulary-replay__history"
                  role="listbox"
                  aria-label="Öğrenilen kartlar"
                >
                  {visibleHistory.map((entry, index) => {
                    const isActive =
                      isReplayActive && index === replayCardIndex;
                    const relativeLabel = formatRelativeTime(entry.capturedAt);
                    return (
                      <button
                        key={entry.key}
                        type="button"
                        className={`vocabulary-replay__history-item ${
                          isActive ? "is-active" : ""
                        }`}
                        onClick={() => handleSelectReplayCard(index)}
                        aria-pressed={isActive}
                        title={relativeLabel || undefined}
                      >
                        {entry.word?.term || "—"}
                      </button>
                    );
                  })}
                </div>

                {isReplayActive ? (
                  <div className="vocabulary-replay__body">
                    {replayWord ? (
                      <>
                        <div className="vocabulary-replay__card">
                          <VocabularyFlashcard
                            term={replayWord.term}
                            translation={replayWord.translation}
                            definition={replayWord.definition}
                            examples={replayWord.examples}
                            notes={replayWord.notes}
                            isFlipped={isReplayRevealed}
                            onFlip={setIsReplayRevealed}
                            hint={{
                              front: "Kartı çevirip hızlıca hatırla",
                              back: "Sonraki karta geçmek için butonları kullan",
                            }}
                            badges={[
                              replayWord.level
                                ? {
                                    id: "level",
                                    label: replayWord.level,
                                    tone: "muted",
                                  }
                                : null,
                              replayWord.category?.name
                                ? {
                                    id: "category",
                                    label: replayWord.category.name,
                                    tone: "primary",
                                  }
                                : null,
                            ].filter(Boolean)}
                            footer={
                              <div className="vocabulary-replay__card-footer">
                                <span className="vocabulary-replay__card-meta">
                                  Kart {formatNumber(replayPosition, "0")} /{" "}
                                  {formatNumber(replayTotal, "0")}
                                </span>
                                {replayCard?.capturedAt && (
                                  <span className="vocabulary-replay__card-sub">
                                    {formatRelativeTime(replayCard.capturedAt)}
                                  </span>
                                )}
                              </div>
                            }
                          />
                        </div>
                        <div className="vocabulary-replay__controls">
                          <div className="vocabulary-replay__controls-group">
                            <button
                              type="button"
                              className="ghost-button"
                              onClick={handleReplayPrev}
                            >
                              Önceki
                            </button>
                            <button
                              type="button"
                              className="ghost-button"
                              onClick={handleReplayNext}
                            >
                              Sonraki
                            </button>
                          </div>
                          <div className="vocabulary-replay__controls-group">
                            <button
                              type="button"
                              className="ghost-button"
                              onClick={toggleReplayReveal}
                            >
                              {isReplayRevealed
                                ? "Kartı gizle"
                                : "Kartı göster"}
                            </button>
                            <button
                              type="button"
                              className="ghost-button vocabulary-replay__clear"
                              onClick={handleClearReplay}
                            >
                              Desteyi temizle
                            </button>
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={handleStopReplay}
                            >
                              Oturumu kapat
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="vocabulary-panel__section-subtitle vocabulary-replay__empty">
                        Tekrar edilecek kart bulunamadı.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="vocabulary-replay__actions">
                    <p className="vocabulary-panel__section-subtitle">
                      Son çözdüğün kartları çalışma prensibine göre hızlıca
                      gözden geçir.
                    </p>
                    <div className="vocabulary-replay__actions-buttons">
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() => handleStartReplay(0)}
                      >
                        Tekrarı başlat
                      </button>
                      <button
                        type="button"
                        className="ghost-button vocabulary-replay__clear"
                        onClick={handleClearReplay}
                      >
                        Desteyi temizle
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          <section className="vocabulary-panel__section">
            <h3 className="vocabulary-panel__section-title">Ödüller</h3>
            <div className="vocabulary-review__hud">
              <div className="vocabulary-review__chip">
                <span className="vocabulary-review__chip-icon vocabulary-review__chip-icon--xp">
                  <TrophyIcon fontSize="inherit" aria-hidden="true" />
                </span>
                <div>
                  <span className="vocabulary-review__chip-label">
                    Oturum XP
                  </span>
                  <strong className="vocabulary-review__chip-value">
                    {formatNumber(sessionXp, "0")}
                  </strong>
                </div>
              </div>
              {sessionGoal != null && (
                <div className="vocabulary-review__chip">
                  <span className="vocabulary-review__chip-icon vocabulary-review__chip-icon--goal">
                    <TargetIcon fontSize="inherit" aria-hidden="true" />
                  </span>
                  <div>
                    <span className="vocabulary-review__chip-label">
                      Günlük hedef
                    </span>
                    <strong className="vocabulary-review__chip-value">
                      {formatNumber(sessionProgress, "0")} /{" "}
                      {formatNumber(sessionGoal, "0")}
                    </strong>
                    <span className="vocabulary-review__chip-sub">
                      %{formatNumber(sessionGoalPct, "0")}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {resultMessage && (
            <div
              className={`vocabulary-panel__status ${
                lastResult?.success
                  ? "vocabulary-panel__status--success"
                  : "vocabulary-panel__status--error"
              }`}
            >
              {resultMessage}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
};

VocabularyLearnGame.propTypes = {
  card: PropTypes.shape({
    word: PropTypes.object,
    progressId: PropTypes.string,
    key: PropTypes.string,
  }),
  queueLength: PropTypes.number,
  loading: PropTypes.bool,
  error: PropTypes.instanceOf(Error),
  stats: PropTypes.shape({
    total: PropTypes.number,
    reviewed: PropTypes.number,
    correct: PropTypes.number,
    lapses: PropTypes.number,
    skipped: PropTypes.number,
  }),
  lastResult: PropTypes.shape({
    success: PropTypes.bool,
    rating: PropTypes.string,
    error: PropTypes.object,
  }),
  isSessionComplete: PropTypes.bool,
  onGrade: PropTypes.func,
  onSkip: PropTypes.func,
  onRestart: PropTypes.func,
  sessionMeta: PropTypes.shape({
    xpEarned: PropTypes.number,
    dailyGoal: PropTypes.number,
    dailyProgress: PropTypes.number,
    lastAward: PropTypes.object,
  }),
};

export default VocabularyLearnGame;
