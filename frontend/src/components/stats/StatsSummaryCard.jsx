import React from "react";
import PropTypes from "prop-types";

const StatsSummaryCard = ({ label, value, helper, icon, accent }) => {
  const accentClass = accent ? `stats-highlight-card--${accent}` : "";

  return (
    <article className={`stats-highlight-card surface-card ${accentClass}`}>
      <header className="stats-highlight-card__header">
        {icon && <div className="stats-highlight-card__icon">{icon}</div>}
        <div className="stats-highlight-card__titles">
          <span className="stats-highlight-card__label">{label}</span>
          {helper && (
            <span className="stats-highlight-card__hint text-secondary">
              {helper}
            </span>
          )}
        </div>
      </header>
      <span className="stats-highlight-card__value">{value}</span>
    </article>
  );
};

StatsSummaryCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  helper: PropTypes.string,
  icon: PropTypes.node,
  accent: PropTypes.string,
};

export default StatsSummaryCard;
