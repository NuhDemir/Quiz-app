import React from "react";
import { ListIcon, FlagIcon, TimerIcon } from "../icons";

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "00:00";
  }
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
};

const difficultyColor = (difficulty) => {
  switch ((difficulty || "").toLowerCase()) {
    case "easy":
      return "chip--success";
    case "medium":
      return "chip--warning";
    case "hard":
      return "chip--danger";
    default:
      return "chip--accent";
  }
};

export default function QuizHeader({
  quiz,
  timeLimitSec,
  elapsedSeconds,
  answeredCount,
  totalQuestions,
  flaggedCount,
  onToggleDrawer,
  isDrawerOpen,
}) {
  const timeRemaining = timeLimitSec
    ? Math.max(0, timeLimitSec - elapsedSeconds)
    : elapsedSeconds;

  const timeLabel = timeLimitSec ? "Kalan süre" : "Geçen süre";
  const formattedTime = formatTime(timeRemaining);

  return (
    <header className="quiz-header surface-card card-content">
      <div className="quiz-header__top">
        <div className="quiz-header__info">
          <span className="chip chip--primary">Quiz</span>
          <h1 className="quiz-header__title">{quiz?.title || "Quiz"}</h1>
          <div className="quiz-header__meta">
            {quiz?.category && (
              <span className="chip chip--outline">{quiz.category}</span>
            )}
            {quiz?.difficulty && (
              <span className={`chip ${difficultyColor(quiz.difficulty)}`}>
                Zorluk: {quiz.difficulty}
              </span>
            )}
            {quiz?.level && (
              <span className="chip chip--outline">Seviye: {quiz.level}</span>
            )}
            {quiz?.tags?.slice?.(0, 3).map((tag) => (
              <span key={tag} className="chip chip--muted">
                #{tag}
              </span>
            ))}
          </div>
        </div>
        <button
          type="button"
          className="secondary-button quiz-header__drawer-btn"
          onClick={onToggleDrawer}
        >
          <ListIcon /> {isDrawerOpen ? "Listeyi kapat" : "Soru listesi"}
        </button>
      </div>
      <div className="quiz-header__stats">
        <div className="quiz-header__stat">
          <span className="quiz-header__stat-label">{timeLabel}</span>
          <span className="quiz-header__stat-value">
            <TimerIcon className="quiz-header__icon" /> {formattedTime}
          </span>
        </div>
        <div className="quiz-header__stat">
          <span className="quiz-header__stat-label">Cevaplanan</span>
          <span className="quiz-header__stat-value">
            {answeredCount}/{totalQuestions}
          </span>
        </div>
        <div className="quiz-header__stat">
          <span className="quiz-header__stat-label">İşaretli</span>
          <span className="quiz-header__stat-value">
            <FlagIcon className="quiz-header__icon" /> {flaggedCount}
          </span>
        </div>
      </div>
    </header>
  );
}
