import React, { useMemo } from "react";
import { CheckIcon, FlagIcon, CloseIcon } from "../icons";

const ensureArray = (value) => (Array.isArray(value) ? value : []);

export default function QuizQuestionCard({
  question,
  index,
  total,
  selectedAnswer,
  reviewMode,
  flagged,
  onSelect,
  onToggleFlag,
  disabled,
}) {
  const options = ensureArray(question?.options);

  const title = useMemo(() => {
    if (!question?.text) return "";
    return question.text;
  }, [question]);

  const showExplanation = reviewMode && question?.explanation;

  return (
    <article className="quiz-question surface-card card-content">
      <header className="quiz-question__header">
        <div>
          <span className="quiz-question__counter">
            Soru {index + 1} / {total}
          </span>
          <h2 className="quiz-question__title">{title}</h2>
        </div>
        <button
          type="button"
          className={`quiz-flag ${flagged ? "quiz-flag--active" : ""}`}
          onClick={onToggleFlag}
        >
          <FlagIcon /> {flagged ? "İşaretlendi" : "Emin değilim"}
        </button>
      </header>

      {question?.media?.type === "image" && question.media.url && (
        <figure className="quiz-question__media">
          <img
            src={question.media.url}
            alt={question.media.alt || "Soru görseli"}
          />
          {question.media.caption && (
            <figcaption className="quiz-question__media-caption">
              {question.media.caption}
            </figcaption>
          )}
        </figure>
      )}

      <div className="quiz-options" role="radiogroup" aria-label="Seçenekler">
        {options.map((option, optionIndex) => {
          const value = option?.value ?? option?.label ?? optionIndex;
          const label = option?.label ?? String(option?.value ?? option);
          const isSelected = selectedAnswer === value;
          const isCorrect = reviewMode && question?.correctAnswer === value;
          const isWrongSelection = reviewMode && isSelected && !isCorrect;

          return (
            <label
              key={option?.id || `${question?.id}-${optionIndex}`}
              className={`quiz-option ${
                isSelected ? "quiz-option--selected" : ""
              } ${isCorrect ? "quiz-option--correct" : ""} ${
                isWrongSelection ? "quiz-option--incorrect" : ""
              }`}
            >
              <input
                type="radio"
                name={`question-${question?.id}`}
                value={option?.id || optionIndex}
                checked={isSelected}
                onChange={() => !disabled && onSelect(value)}
                disabled={disabled}
              />
              <span className="quiz-option__label">{label}</span>
              {reviewMode && (
                <span className="quiz-option__status" aria-hidden="true">
                  {isCorrect && <CheckIcon />}
                  {isWrongSelection && <CloseIcon />}
                </span>
              )}
            </label>
          );
        })}
      </div>

      {showExplanation && (
        <footer className="quiz-question__explanation">
          <h3>Doğru cevap açıklaması</h3>
          <p>{question.explanation}</p>
        </footer>
      )}
    </article>
  );
}
