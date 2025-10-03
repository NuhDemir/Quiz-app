import React from "react";
import PropTypes from "prop-types";

const StatsLayout = ({ hero, children, sidebar }) => {
  const hasSidebar = Boolean(sidebar);
  const bodyClassName = hasSidebar
    ? "stats-layout__body stats-layout__body--with-sidebar"
    : "stats-layout__body";

  return (
    <div className="stats-page layout-wrapper">
      {hero && <section className="stats-layout__hero">{hero}</section>}
      <div className={bodyClassName}>
        <div className="stats-layout__content stats-grid">{children}</div>
        {hasSidebar && (
          <aside className="stats-layout__sidebar">{sidebar}</aside>
        )}
      </div>
    </div>
  );
};

StatsLayout.propTypes = {
  hero: PropTypes.node,
  children: PropTypes.node,
  sidebar: PropTypes.node,
};

export default StatsLayout;
