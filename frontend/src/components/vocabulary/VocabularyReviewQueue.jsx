import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import VocabularyFlashcard from "./VocabularyFlashcard";
import { TrophyIcon, StreakIcon, TargetIcon } from "../icons";

const ratingButtons = [
  {
    id: "again",
    label: "Tekrar (Çalışma Prensibi)",
    description: "Tekrar çalışma prensibine göre kartı hemen yeniden göster",
    variant: "danger",
    shortcut: "1",
  },
  {
    id: "hard",
    label: "Zor",
    description: "Biraz daha pratik",
    variant: "warning",
    shortcut: "2",
  },
  {
    id: "good",
    label: "İyi",
    description: "Doğru hatırladım",
    variant: "primary",
    shortcut: "3",
  },
  {
    id: "easy",
    label: "Çok kolay",
    description: "Bir daha gösterme",
    variant: "success",
    shortcut: "4",
  },
];

const ratingLabels = {
  again: "Tekrar (Çalışma Prensibi)",
  hard: "Zor",
  good: "İyi",
  easy: "Çok kolay",
  skip: "Pas",
};

const VocabularyReviewQueue = ({
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

  const activeKey = card?.key || card?.progressId || card?.word?._id;

  useEffect(() => {
    if (!activeKey || activeKey === cardKey) return;
    setIsRevealed(false);
    setCardKey(activeKey);
  }, [activeKey, cardKey]);

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

      const button = ratingButtons.find((item) => item.shortcut === event.key);
      if (button) {
        event.preventDefault();
        onGrade?.(button.id);
        setIsRevealed(false);
        return;
      }

      if (event.key === "0") {
        event.preventDefault();
        onSkip?.();
        setIsRevealed(false);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [card, isRevealed, onGrade, onSkip]);

  const reviewed = stats.reviewed || 0;
  const total = useMemo(() => {
    const base = stats.total || 0;
    const dynamic = reviewed + queueLength;
    return Math.max(base, dynamic);
  }, [queueLength, reviewed, stats.total]);

  const progressPercent = total > 0 ? Math.round((reviewed / total) * 100) : 0;
  const displayPosition = Math.min(reviewed + (card ? 1 : 0), total);

  const rewardXp =
    lastResult?.payload?.reward?.xp ??
    lastResult?.payload?.xpAwarded ??
    sessionMeta?.lastAward?.xp ??
    null;

  const resultMessage = lastResult?.success
    ? `${ratingLabels[lastResult.rating] || ""} yanıt kaydedildi${
        rewardXp ? ` · +${rewardXp} XP` : ""
      }`
    : lastResult?.error
    ? lastResult.error.message || "Kart kaydedilemedi"
    : null;

  const sessionXp = sessionMeta?.xpEarned || 0;
  const sessionStreak = sessionMeta?.streak ?? stats.streak ?? 0;
  const sessionCombo = sessionMeta?.combo ?? 0;
  const sessionGoal = sessionMeta?.dailyGoal ?? null;
  const sessionProgress = sessionMeta?.dailyProgress ?? reviewed;

  const sessionGoalPct = sessionGoal
    ? Math.min(100, Math.round((sessionProgress / sessionGoal) * 100))
    : sessionProgress > 0
    ? 100
    : 0;

  if (error) {
    return (
      <div className="surface-card card-content vocabulary-section">
        <div className="alert alert--error">
          {error.message || "Tekrar listesi yüklenemedi"}
        </div>
      </div>
    );
  }

  if (loading && !card) {
    return (
      <div className="surface-card card-content vocabulary-section">
        <div className="vocabulary-grid__placeholder">
          Kartlar hazırlanıyor...
        </div>
      </div>
    );
  }

  if (isSessionComplete) {
    return (
      <div className="surface-card card-content vocabulary-section vocabulary-review__complete">
        <header className="vocabulary-section__header">
          <div>
            <h2>Günün tekrarları tamamlandı 👏</h2>
            <p className="text-secondary text-sm">
              {reviewed} kartı gözden geçirdin. {stats.correct || 0} tanesi
              doğru, {stats.lapses || 0} tanesi tekrar gerektirdi. Harika
              ilerliyorsun!
            </p>
          </div>
        </header>
        <div className="vocabulary-review__summary">
          <div>
            <span className="vocabulary-review__summary-label">Doğru</span>
            <strong>{stats.correct || 0}</strong>
          </div>
          <div>
            <span className="vocabulary-review__summary-label">Tekrar</span>
            <strong>{stats.lapses || 0}</strong>
          </div>
          <div>
            <span className="vocabulary-review__summary-label">Seri</span>
            <strong>{stats.streak || 0}</strong>
          </div>
        </div>
        <div className="vocabulary-review__actions">
          <button type="button" className="primary-button" onClick={onRestart}>
            Yeni deste getir
          </button>
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="surface-card card-content vocabulary-section">
        <div className="vocabulary-grid__placeholder">
          Tüm kartları tamamladınız! Yeni kelimeler öğrenmeye devam edin.
        </div>
      </div>
    );
  }

  const { word } = card;

  const handleReveal = () => {
    setIsRevealed(true);
  };

  const handleGrade = (ratingId) => {
    onGrade?.(ratingId);
    setIsRevealed(false);
  };

  return (
    <div className="surface-card card-content vocabulary-review">
      <header className="vocabulary-section__header">
        <div>
          <h2>Tekrar kartları</h2>
          <p className="text-secondary text-sm">
            Önce kelimeyi hatırlamayı dene, ardından cevabı gösterip kartı
            değerlendir.
          </p>
        </div>
        <div className="vocabulary-review__meta">
          <span className="badge">
            Kart {displayPosition || 1} / {total || "—"}
          </span>
          <span className="badge badge--muted">{queueLength} kart kaldı</span>
        </div>
      </header>

      <div className="vocabulary-review__hud">
        <div className="vocabulary-review__chip">
          <span className="vocabulary-review__chip-icon vocabulary-review__chip-icon--xp">
            <TrophyIcon fontSize="inherit" aria-hidden="true" />
          </span>
          <div>
            <span className="vocabulary-review__chip-label">Oturum XP</span>
            <strong className="vocabulary-review__chip-value">
              {sessionXp.toLocaleString("tr-TR")}
            </strong>
          </div>
        </div>
        <div className="vocabulary-review__chip">
          <span className="vocabulary-review__chip-icon vocabulary-review__chip-icon--streak">
            <StreakIcon fontSize="inherit" aria-hidden="true" />
          </span>
          <div>
            <span className="vocabulary-review__chip-label">Seri</span>
            <strong className="vocabulary-review__chip-value">
              {sessionStreak.toLocaleString("tr-TR")}
            </strong>
            <span className="vocabulary-review__chip-sub">
              Combo {sessionCombo.toLocaleString("tr-TR")}
            </span>
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
                {sessionProgress.toLocaleString("tr-TR")} /{" "}
                {sessionGoal.toLocaleString("tr-TR")}
              </strong>
              <span className="vocabulary-review__chip-sub">
                %{sessionGoalPct}
              </span>
            </div>
          </div>
        )}
      </div>

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
          <span>Doğru: {stats.correct || 0}</span>
          <span>Tekrar: {stats.lapses || 0}</span>
          <span>Seri: {stats.streak || 0}</span>
        </div>
      </div>

      {resultMessage && (
        <div
          className={`vocabulary-review__status ${
            lastResult?.success ? "is-success" : "is-error"
          }`}
        >
          {resultMessage}
        </div>
      )}

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
          back: "Derecelendirmek için butonları kullan",
        }}
        badges={[
          word?.level
            ? { id: "level", label: word.level, tone: "muted" }
            : null,
          word?.category?.name
            ? { id: "category", label: word.category.name, tone: "primary" }
            : null,
        ].filter(Boolean)}
      />

      <footer className="vocabulary-review__actions">
        {!isRevealed ? (
          <>
            <button
              type="button"
              className="secondary-button"
              onClick={() => onSkip?.()}
            >
              Şimdilik pas (0)
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
              onClick={() => onSkip?.()}
            >
              Şimdilik pas (0)
            </button>
            {ratingButtons.map((button) => (
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
  );
};

VocabularyReviewQueue.propTypes = {
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
    streak: PropTypes.number,
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
    streak: PropTypes.number,
    combo: PropTypes.number,
    maxCombo: PropTypes.number,
    dailyProgress: PropTypes.number,
    dailyGoal: PropTypes.number,
    unlockedDecks: PropTypes.array,
    achievements: PropTypes.array,
    lastAward: PropTypes.shape({
      xp: PropTypes.number,
      type: PropTypes.string,
      label: PropTypes.string,
    }),
  }),
};

export default VocabularyReviewQueue;
