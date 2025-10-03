import React from "react";
import { CloseIcon, FlagIcon } from "../icons";

function QuizDrawer({
  open,
  questions,
  answers,
  flags,
  activeIndex,
  onSelect,
  onClose,
}) {
  if (!open) return null;

  return (
    <div className="quiz-drawer" role="dialog" aria-modal="true">
      <div className="quiz-drawer__backdrop" onClick={onClose} />
      <div className="quiz-drawer__panel surface-card">
        <header className="quiz-drawer__header">
          <h3>Sorular</h3>
          <button type="button" className="icon-button" onClick={onClose}>
            <CloseIcon />
          </button>
        </header>
        <div className="quiz-drawer__content">
          {questions.map((question, index) => {
            const questionId = question.id;
            const answered = Object.prototype.hasOwnProperty.call(
              answers,
              questionId
            );
            const flagged = flags?.[questionId];
            const isActive = index === activeIndex;
            const text = question.text || "Soru";
            const previewText =
              text.length > 80 ? `${text.slice(0, 80)}…` : text;

            return (
              <button
                key={questionId || index}
                type="button"
                className={`quiz-drawer__item ${
                  isActive ? "quiz-drawer__item--active" : ""
                } ${answered ? "quiz-drawer__item--answered" : ""}`}
                onClick={() => onSelect(index)}
              >
                <span className="quiz-drawer__number">{index + 1}</span>
                <span className="quiz-drawer__text">{previewText}</span>
                {flagged && (
                  <span className="quiz-drawer__flag" aria-label="İşaretli">
                    <FlagIcon />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default QuizDrawer;
