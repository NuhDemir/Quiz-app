import React from "react";
import StatsSuggestionCard from "./StatsSuggestionCard";

const StatsSuggestions = ({ items = [], loading }) => {
  return (
    <section className="stats-section stats-sidebar-section">
      <div className="stats-sidebar-section__header">
        <h3>Kişisel Öneriler</h3>
        <span className="stats-sidebar-section__hint">
          Hedeflerine göre sıradaki adımları keşfet
        </span>
      </div>

      {loading ? (
        <div className="stats-personal-placeholder">
          Öneriler hazırlanıyor...
        </div>
      ) : items.length ? (
        <div className="stats-personal-grid">
          {items.map((item) => (
            <StatsSuggestionCard
              key={item.id || item.title}
              title={item.title}
              description={item.description}
              metric={item.metric}
              onAction={item.onAction}
            />
          ))}
        </div>
      ) : (
        <div className="stats-personal-placeholder">
          Kişisel öneri oluşturmak için biraz daha veri gerekiyor. Quiz çözdükçe
          akıllı öneriler göreceksin.
        </div>
      )}
    </section>
  );
};

export default StatsSuggestions;
