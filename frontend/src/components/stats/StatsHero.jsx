import React from "react";
import { TrophyIcon, TimelineIcon, StreakIcon, TimeIcon } from "../icons";
import { computeAverageSessionTime } from "../../utils/statsHelpers";

const StatsHero = ({ xpInfo, aggregatedProgress }) => {
  if (!aggregatedProgress) return null;

  const averageTime = computeAverageSessionTime(
    aggregatedProgress.recentSessions
  );

  const heroMetrics = [
    {
      label: "Doğruluk",
      value: `%${Math.round(aggregatedProgress.accuracy || 0)}`,
      helper: "Genel doğruluk oranı",
      icon: <TimelineIcon fontSize="small" />,
    },
    {
      label: "Seri",
      value: aggregatedProgress.streak || 0,
      helper: "Kesintisiz doğru cevap serisi",
      icon: <StreakIcon fontSize="small" />,
    },
    {
      label: "Ortalama Süre",
      value: `${averageTime || 0}s`,
      helper: "Quiz başına ortalama süre",
      icon: <TimeIcon fontSize="small" />,
    },
  ];

  return (
    <section className="surface-card stats-hero">
      <div className="stats-hero__header">
        <div>
          <span className="chip chip--accent">Seviye {xpInfo.level}</span>
          <h1 className="stats-hero__title">İstatistik Özeti</h1>
          <p className="stats-hero__subtitle text-secondary">
            Performansını yakından izle ve sonraki seviyeye hazırlık yap.
          </p>
        </div>
        <div className="stats-hero__xp">
          <div className="stats-hero__xp-icon">
            <TrophyIcon fontSize="large" />
          </div>
          <div>
            <p className="stats-hero__xp-label">Toplam XP</p>
            <p className="stats-hero__xp-value">{aggregatedProgress.xp}</p>
          </div>
        </div>
      </div>

      <div className="stats-hero__progress">
        <div className="stats-hero__progress-header">
          <span>Sonraki Seviye: {xpInfo.level + 1}</span>
          <span className="text-secondary">{xpInfo.xpToNext} XP kaldı</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-bar__fill"
            style={{ width: `${xpInfo.progressPct || 0}%` }}
          />
        </div>
      </div>

      <div className="stats-hero__metrics">
        {heroMetrics.map((metric) => (
          <div key={metric.label} className="stats-hero__metric">
            <div className="stats-hero__metric-icon">{metric.icon}</div>
            <div>
              <p className="stats-hero__metric-label">{metric.label}</p>
              <p className="stats-hero__metric-value">{metric.value}</p>
              <p className="stats-hero__metric-helper text-secondary">
                {metric.helper}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default StatsHero;
