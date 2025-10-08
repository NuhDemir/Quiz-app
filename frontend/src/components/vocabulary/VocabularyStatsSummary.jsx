import React from "react";
import PropTypes from "prop-types";

const VocabularyStatsSummary = ({ stats = [] }) => {
  if (!stats.length) return null;

  return (
    <section className="surface-card card-content vocabulary-section">
      <h2>Kelime ilerlemeniz</h2>
      <div className="category-summary-grid">
        {stats.map((item) => (
          <article key={item.id} className="surface-card vocabulary-stat-card">
            <span className="vocabulary-stat-card__label">{item.label}</span>
            <span className="vocabulary-stat-card__value">{item.value}</span>
            {item.hint && (
              <span className="vocabulary-stat-card__hint">{item.hint}</span>
            )}
          </article>
        ))}
      </div>
    </section>
  );
};

VocabularyStatsSummary.propTypes = {
  stats: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      hint: PropTypes.string,
    })
  ),
};

export default VocabularyStatsSummary;
