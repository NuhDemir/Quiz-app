import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
} from "recharts";

const CategoryTooltip = ({ active, payload, label }) => {
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
        <span>Deneme</span>
        <strong>{item.attempts}</strong>
      </div>
    </div>
  );
};

const StatsCategoryChart = ({ data = [] }) => {
  const hasData = data.some((item) => item.attempts > 0 || item.accuracy > 0);

  return (
    <section className="stats-section">
      <h2 className="section-heading">Kategori Performansı</h2>
      <div className="surface-card stats-chart-card">
        {hasData ? (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data} margin={{ left: 4, right: 8, top: 16 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(148, 163, 184, 0.2)"
              />
              <XAxis
                dataKey="category"
                stroke="var(--color-text-secondary)"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                stroke="var(--color-text-secondary)"
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                unit="%"
              />
              <Tooltip
                content={<CategoryTooltip />}
                cursor={{ fill: "rgba(15, 23, 42, 0.04)" }}
              />
              <Bar
                dataKey="accuracy"
                fill="var(--color-primary)"
                radius={[12, 12, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="stats-chart-card__empty">
            Henüz kategori bazlı veri bulunmuyor.
          </div>
        )}
      </div>
    </section>
  );
};

export default StatsCategoryChart;
