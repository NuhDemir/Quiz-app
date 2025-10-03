import React from "react";
import { ArrowLeftIcon, ArrowRightIcon, FlagIcon } from "../icons";

export default function QuizFooter({
  currentIndex,
  total,
  progressPercent,
  unansweredCount,
  flaggedCount,
  onPrev,
  onNext,
  onFinish,
  canPrev,
  canNext,
  disabled,
  submitting,
  finishLabel = "Quiz'i Bitir",
}) {
  return (
    <footer className="quiz-footer surface-card card-content">
      <div className="quiz-footer__progress">
        <div className="quiz-footer__progress-info">
          <span>
            İlerleme: {currentIndex + 1}/{total}
          </span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div className="quiz-footer__progress-bar">
          <div
            className="quiz-footer__progress-indicator"
            style={{ width: `${Math.min(100, Math.round(progressPercent))}%` }}
          />
        </div>
        <div className="quiz-footer__meta">
          <span>{unansweredCount} soru yanıt bekliyor</span>
          <span>
            <FlagIcon /> {flaggedCount} işaretli soru
          </span>
        </div>
      </div>
      <div className="quiz-footer__actions">
        <button
          type="button"
          className="secondary-button"
          onClick={onPrev}
          disabled={disabled || !canPrev}
        >
          <ArrowLeftIcon /> Önceki
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={onNext}
          disabled={disabled || !canNext}
        >
          Sonraki <ArrowRightIcon />
        </button>
        {onFinish && (
          <button
            type="button"
            className="primary-button"
            onClick={onFinish}
            disabled={disabled || submitting}
          >
            {submitting ? "Gönderiliyor..." : finishLabel}
          </button>
        )}
      </div>
    </footer>
  );
}
