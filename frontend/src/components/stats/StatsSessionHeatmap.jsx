import React from "react";

const COLOR_STEPS = [
  "var(--color-primary-50)",
  "var(--color-primary-100)",
  "var(--color-primary-200)",
  "var(--color-primary-300)",
  "var(--color-primary)",
];

const getColor = (value, max = 1) => {
  if (!value || max <= 0) return COLOR_STEPS[0];
  const normalized = Math.min(1, value / max);
  const index = Math.min(
    COLOR_STEPS.length - 1,
    Math.floor(normalized * (COLOR_STEPS.length - 1))
  );
  return COLOR_STEPS[index];
};

const StatsSessionHeatmap = ({ data }) => {
  if (!data || !data.matrix) {
    return (
      <section className="stats-section">
        <h2 className="section-heading">Oturum Isı Haritası</h2>
        <div className="surface-card stats-chart-card">
          <div className="stats-chart-card__empty">
            Isı haritası için yeterli veri bulunamadı.
          </div>
        </div>
      </section>
    );
  }

  const { matrix, dayLabels, hourLabels, max } = data;

  return (
    <section className="stats-section">
      <div className="section-heading-row">
        <h2 className="section-heading">Oturum Isı Haritası</h2>
        <span className="text-secondary stats-section__hint">
          En aktif olduğun gün ve saat aralıklarını keşfet
        </span>
      </div>
      <div className="surface-card stats-heatmap-card">
        <div className="stats-heatmap">
          <div className="stats-heatmap__header">
            <span />
            <div className="stats-heatmap__columns">
              {hourLabels.map((hour) => (
                <span key={hour}>{hour}</span>
              ))}
            </div>
          </div>
          <div className="stats-heatmap__body">
            {matrix.map((row, rowIndex) => (
              <div
                key={dayLabels[rowIndex] || rowIndex}
                className="stats-heatmap__row"
              >
                <span className="stats-heatmap__label">
                  {dayLabels[rowIndex] || rowIndex}
                </span>
                <div className="stats-heatmap__cells">
                  {row.map((value, colIndex) => (
                    <span
                      key={`${rowIndex}-${colIndex}`}
                      className="stats-heatmap__cell"
                      title={`${dayLabels[rowIndex] || rowIndex} • ${
                        hourLabels[colIndex] || colIndex
                      }\nOturum: ${value}`}
                      style={{ backgroundColor: getColor(value, max) }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="stats-heatmap__legend">
          <span>Az</span>
          <div className="stats-heatmap__legend-bar">
            {COLOR_STEPS.map((color) => (
              <span key={color} style={{ backgroundColor: color }} />
            ))}
          </div>
          <span>Çok</span>
        </div>
      </div>
    </section>
  );
};

export default StatsSessionHeatmap;
