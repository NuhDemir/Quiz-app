import React from "react";
import StatsInsightCard from "./StatsInsightCard";
import { BoltIcon, TargetIcon, SchoolIcon, FireIcon } from "../icons";

const ICON_COMPONENTS = [BoltIcon, TargetIcon, SchoolIcon, FireIcon];

const StatsQuickInsights = ({ items = [], loading }) => {
  return (
    <section className="stats-section stats-sidebar-section">
      <div className="stats-sidebar-section__header">
        <h3>Hızlı İçgörüler</h3>
        <span className="stats-sidebar-section__hint">
          Performansını güçlendirecek kısa notlar
        </span>
      </div>

      {loading ? (
        <div className="stats-personal-placeholder">
          İçgörüler hesaplanıyor...
        </div>
      ) : items.length ? (
        <div className="stats-personal-grid">
          {items.map((item, index) => {
            const IconComponent =
              ICON_COMPONENTS[index % ICON_COMPONENTS.length];
            return (
              <StatsInsightCard
                key={item.id || item.title || index}
                title={item.title}
                description={item.description}
                badge={item.metric || item.badge}
                icon={<IconComponent fontSize="medium" />}
                action={item.action}
              />
            );
          })}
        </div>
      ) : (
        <div className="stats-personal-placeholder">
          İçgörü paylaşmak için henüz yeterli veri yok. Quiz çözmeye devam et,
          burada kişisel tüyolar göreceksin.
        </div>
      )}
    </section>
  );
};

export default StatsQuickInsights;
