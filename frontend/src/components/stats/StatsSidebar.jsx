import React from "react";
import PropTypes from "prop-types";
import StatsQuickInsights from "./StatsQuickInsights";
import StatsSuggestions from "./StatsSuggestions";

const StatsSidebar = ({ insights = [], suggestions = [], loading = false }) => {
  const loadingInsights = loading && !insights.length;
  const loadingSuggestions = loading && !suggestions.length;

  return (
    <div className="stats-sidebar">
      <StatsQuickInsights items={insights} loading={loadingInsights} />
      <StatsSuggestions items={suggestions} loading={loadingSuggestions} />
    </div>
  );
};

StatsSidebar.propTypes = {
  insights: PropTypes.array,
  suggestions: PropTypes.array,
  loading: PropTypes.bool,
};

export default StatsSidebar;
