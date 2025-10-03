import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

const COLORS = {
  default: "var(--color-primary-200)",
  highlight: "var(--color-primary)",
};

const DistributionTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div className="stats-tooltip">
      <span className="stats-tooltip__title">{item.label}</span>
      <div className="stats-tooltip__row">
        <span>Oyuncu sayısı</span>
        <strong>{item.count}</strong>
      </div>
      <div className="stats-tooltip__row">
        <span>Oran</span>
        <strong>%{item.percentage}</strong>
      </div>
    </div>
  );
};

const StatsPeerDistribution = ({ data = [], loading }) => {
  const hasData = Array.isArray(data) && data.some((item) => item.count > 0);

  return (
    <section className="stats-section">
      <div className="section-heading-row">
        <h2 className="section-heading">Topluluk Dağılımı</h2>
        <span className="text-secondary stats-section__hint">
          Başarı yüzdelik diliminde nerede olduğunu gör
        </span>
      </div>
      <div className="surface-card stats-chart-card">
        {loading ? (
          <div className="stats-chart-card__empty">
            Liderboard yükleniyor...
          </div>
        ) : hasData ? (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data} margin={{ left: 8, right: 8, top: 24 }}>
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(59, 130, 246, 0.08)" }}
                content={<DistributionTooltip />}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {data.map((entry) => (
                  <Cell
                    key={entry.label}
                    fill={
                      entry.isCurrentUserBucket
                        ? COLORS.highlight
                        : COLORS.default
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="stats-chart-card__empty">
            Dağılım grafiği için yeterli veri bulunamadı.
          </div>
        )}
      </div>
    </section>
  );
};

export default StatsPeerDistribution;
