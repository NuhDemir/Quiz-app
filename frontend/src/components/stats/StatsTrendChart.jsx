import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const formatLabel = (entry = {}) => {
  if (!entry.takenAt) {
    return entry.name;
  }
  try {
    return new Date(entry.takenAt).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "short",
    });
  } catch (error) {
    return entry.name;
  }
};

const TrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="stats-tooltip">
      <span className="stats-tooltip__title">{label}</span>
      <div className="stats-tooltip__row">
        <span>Doğruluk</span>
        <strong>%{item.accuracy}</strong>
      </div>
      <div className="stats-tooltip__row">
        <span>Süre</span>
        <strong>{item.duration || 0}s</strong>
      </div>
    </div>
  );
};

const StatsTrendChart = ({ data = [], loading }) => {
  return (
    <section className="stats-section">
      <h2 className="section-heading">Oturum Doğruluk Trendiniz</h2>
      <div className="surface-card stats-chart-card">
        {loading ? (
          <div className="stats-chart-card__empty">Yükleniyor...</div>
        ) : data.length ? (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={data} margin={{ left: 12, right: 12, top: 16 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(148, 163, 184, 0.2)"
              />
              <XAxis
                dataKey={(entry) => formatLabel(entry)}
                stroke="var(--color-text-secondary)"
              />
              <YAxis
                stroke="var(--color-text-secondary)"
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                unit="%"
              />
              <Tooltip
                content={<TrendTooltip />}
                cursor={{ stroke: "var(--color-primary)", strokeWidth: 1 }}
              />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="var(--color-primary)"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="stats-chart-card__empty">
            Trend grafiği için yeterli veri bulunamadı.
          </div>
        )}
      </div>
    </section>
  );
};

export default StatsTrendChart;
