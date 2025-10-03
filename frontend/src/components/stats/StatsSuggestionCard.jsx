import React from "react";
import PropTypes from "prop-types";

const StatsSuggestionCard = ({ title, description, metric, onAction }) => {
  return (
    <article className="stats-personal-card stats-personal-card--suggestion surface-card">
      {metric && (
        <span className="stats-personal-card__metric chip chip--accent">
          {metric}
        </span>
      )}
      <h3 className="stats-personal-card__title">{title}</h3>
      {description && (
        <p className="stats-personal-card__description text-secondary">
          {description}
        </p>
      )}
      {onAction && (
        <button type="button" className="tertiary-button" onClick={onAction}>
          Detaylar
        </button>
      )}
    </article>
  );
};

StatsSuggestionCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  metric: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onAction: PropTypes.func,
};

export default StatsSuggestionCard;
