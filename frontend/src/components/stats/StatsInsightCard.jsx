import React from "react";
import PropTypes from "prop-types";

const StatsInsightCard = ({ title, description, badge, icon, action }) => {
  return (
    <article className="stats-personal-card stats-personal-card--insight surface-card">
      <div className="stats-personal-card__icon-wrapper">{icon}</div>
      {badge && (
        <span className="stats-personal-card__metric chip chip--accent">
          {badge}
        </span>
      )}
      <h3 className="stats-personal-card__title">{title}</h3>
      {description && (
        <p className="stats-personal-card__description text-secondary">
          {description}
        </p>
      )}
      {action && <div className="stats-personal-card__action">{action}</div>}
    </article>
  );
};

StatsInsightCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  badge: PropTypes.string,
  icon: PropTypes.node,
  action: PropTypes.node,
};

export default StatsInsightCard;
