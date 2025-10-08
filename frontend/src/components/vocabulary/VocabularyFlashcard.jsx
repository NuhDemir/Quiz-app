import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";

const VocabularyFlashcard = ({
  term,
  translation,
  definition,
  examples = [],
  notes,
  onFlip,
  isFlipped,
  hint,
  badges = [],
  footer,
}) => {
  const isControlled = typeof isFlipped === "boolean";
  const [internalFlipped, setInternalFlipped] = useState(false);

  const flipped = isControlled ? isFlipped : internalFlipped;

  useEffect(() => {
    if (isControlled) return;
    setInternalFlipped(false);
  }, [term, translation, isControlled]);

  const frontHint = hint?.front;
  const backHint = hint?.back;

  const handleFlip = () => {
    const nextValue = !flipped;
    if (!isControlled) {
      setInternalFlipped(nextValue);
    }
    onFlip?.(nextValue);
  };

  return (
    <div className={`vocabulary-flashcard ${flipped ? "is-flipped" : ""}`}>
      <button
        type="button"
        className="vocabulary-flashcard__body"
        onClick={handleFlip}
        aria-label={
          flipped ? "Türkçe anlamını gizle" : "Türkçe anlamını göster"
        }
      >
        {!flipped ? (
          <div className="vocabulary-flashcard__front">
            <span className="vocabulary-flashcard__eyebrow">İngilizce</span>
            <h3 className="vocabulary-flashcard__term">{term}</h3>
            {definition && (
              <p className="vocabulary-flashcard__definition">{definition}</p>
            )}
            {frontHint && (
              <span className="vocabulary-flashcard__hint">{frontHint}</span>
            )}
            {!frontHint && (
              <span className="vocabulary-flashcard__hint">Kartı çevir</span>
            )}
          </div>
        ) : (
          <div className="vocabulary-flashcard__back">
            <span className="vocabulary-flashcard__eyebrow">Türkçe</span>
            <h3 className="vocabulary-flashcard__term">{translation || "—"}</h3>
            {examples.length > 0 && (
              <ul className="vocabulary-flashcard__examples">
                {examples.slice(0, 3).map((example, idx) => (
                  <li key={idx}>{example}</li>
                ))}
              </ul>
            )}
            {notes && <p className="vocabulary-flashcard__notes">{notes}</p>}
            {backHint && (
              <span className="vocabulary-flashcard__hint vocabulary-flashcard__hint--back">
                {backHint}
              </span>
            )}
          </div>
        )}
      </button>
      {(badges.length > 0 || footer) && (
        <div className="vocabulary-flashcard__footer">
          {badges.length > 0 && (
            <div className="vocabulary-flashcard__badges">
              {badges.map((badge) => (
                <span
                  key={badge.id || badge.label}
                  className={`chip chip--${badge.tone || "muted"}`}
                >
                  {badge.icon && (
                    <span className="chip__icon" aria-hidden="true">
                      {badge.icon}
                    </span>
                  )}
                  {badge.label}
                </span>
              ))}
            </div>
          )}
          {footer && (
            <div className="vocabulary-flashcard__footer-content">{footer}</div>
          )}
        </div>
      )}
    </div>
  );
};

VocabularyFlashcard.propTypes = {
  term: PropTypes.string.isRequired,
  translation: PropTypes.string,
  definition: PropTypes.string,
  examples: PropTypes.arrayOf(PropTypes.string),
  onFlip: PropTypes.func,
  isFlipped: PropTypes.bool,
  hint: PropTypes.shape({
    front: PropTypes.string,
    back: PropTypes.string,
  }),
  badges: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      label: PropTypes.string.isRequired,
      tone: PropTypes.oneOf([
        "muted",
        "primary",
        "success",
        "warning",
        "danger",
      ]),
      icon: PropTypes.node,
    })
  ),
  notes: PropTypes.string,
  footer: PropTypes.node,
};

export default VocabularyFlashcard;
