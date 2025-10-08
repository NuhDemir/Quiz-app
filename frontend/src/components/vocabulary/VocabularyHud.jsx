import React, { useMemo } from "react";
import PropTypes from "prop-types";
import {
  StatsIcon,
  TimelineIcon,
  StreakIcon,
  TimeIcon,
  TrophyIcon,
  TargetIcon,
  FireIcon,
} from "../icons";

const VocabularyHud = ({
  aggregatedProgress,
  xpInfo,
  averageSessionTime,
  dailyGoal,
  dailyProgress,
  outstandingReviews,
  quickInsights,
}) => {
  const statItems = useMemo(
    () => [
      {
        id: "total-quizzes",
        label: "Toplam Quiz",
        value: (aggregatedProgress?.totalQuizzes || 0).toLocaleString("tr-TR"),
        icon: StatsIcon,
        tone: "primary",
      },
      {
        id: "accuracy",
        label: "Doğruluk",
        value: `%${Math.round(aggregatedProgress?.accuracy || 0)}`,
        icon: TimelineIcon,
        tone: "success",
      },
      {
        id: "streak",
        label: "Seri",
        value: (aggregatedProgress?.streak || 0).toLocaleString("tr-TR"),
        icon: StreakIcon,
        tone: "warning",
      },
      {
        id: "avg-time",
        label: "Ortalama Süre",
        value: `${Math.round(averageSessionTime || 0)}s`,
        icon: TimeIcon,
        tone: "danger",
      },
      {
        id: "xp",
        label: "XP",
        value: (xpInfo?.xp || aggregatedProgress?.xp || 0).toLocaleString(
          "tr-TR"
        ),
        icon: TrophyIcon,
        tone: "primary",
      },
      {
        id: "level",
        label: "Seviye",
        value: xpInfo?.level || 1,
        icon: TargetIcon,
        tone: "muted",
      },
    ],
    [aggregatedProgress, averageSessionTime, xpInfo]
  );

  const dailyProgressCount = Math.max(0, dailyProgress || 0);
  const safeGoal = Math.max(0, dailyGoal || 0);
  const dailyProgressPct = safeGoal
    ? Math.min(100, Math.round((dailyProgressCount / safeGoal) * 100))
    : dailyProgressCount > 0
    ? 100
    : 0;

  const outstandingLabel = useMemo(() => {
    if (!outstandingReviews) return "Tüm kartları tamamladın";
    if (outstandingReviews < 3) return "Son birkaç kart kaldı";
    if (outstandingReviews < 8) return "Tekrar kuyruğu hazır";
    return "Bugün yapacak çok şey var";
  }, [outstandingReviews]);

  return (
    <section className="surface-card card-content vocabulary-hud">
      <header className="vocabulary-hud__header">
        <div>
          <h2>Bugünkü ilerlemen</h2>
          <p className="text-secondary text-sm">
            Serini koru, XP biriktir ve günlük hedefini tamamla.
          </p>
        </div>
        <div className="vocabulary-hud__pills">
          <span className="vocabulary-hud__pill vocabulary-hud__pill--streak">
            <FireIcon fontSize="inherit" aria-hidden="true" />
            <strong>
              {(aggregatedProgress?.streak || 0).toLocaleString("tr-TR")}
            </strong>
            <span>seri</span>
          </span>
          <span className="vocabulary-hud__pill vocabulary-hud__pill--queue">
            <StatsIcon fontSize="inherit" aria-hidden="true" />
            <strong>{outstandingReviews || 0}</strong>
            <span>kart sırada</span>
          </span>
        </div>
      </header>

      <div className="vocabulary-hud__stats">
        {statItems.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.id} className="vocabulary-hud__card">
              <span
                className={`vocabulary-hud__icon vocabulary-hud__icon--${item.tone}`}
              >
                <Icon fontSize="inherit" aria-hidden="true" />
              </span>
              <div className="vocabulary-hud__meta">
                <span className="vocabulary-hud__label">{item.label}</span>
                <strong className="vocabulary-hud__value">{item.value}</strong>
              </div>
            </article>
          );
        })}
      </div>

      <div className="vocabulary-hud__progress-grid">
        <div className="vocabulary-hud__progress-card">
          <div className="vocabulary-hud__progress-header">
            <span className="vocabulary-hud__progress-title">
              Seviye {xpInfo?.level || 1}
            </span>
            <span className="text-secondary text-sm">
              {(xpInfo?.xp || 0).toLocaleString("tr-TR")} XP
            </span>
          </div>
          <div className="progress-bar" aria-label="XP ilerleme çubuğu">
            <span
              className="progress-bar__fill"
              style={{ width: `${Math.min(100, xpInfo?.progressPct || 0)}%` }}
            />
          </div>
          <div className="vocabulary-hud__progress-meta">
            <span>{Math.min(100, xpInfo?.progressPct || 0)}% tamamlandı</span>
            <span>
              {(xpInfo?.xpToNext || 0).toLocaleString("tr-TR")} XP sonra{" "}
              {(xpInfo?.level || 1) + 1}. seviye
            </span>
          </div>
        </div>

        <div className="vocabulary-hud__progress-card">
          <div className="vocabulary-hud__progress-header">
            <span className="vocabulary-hud__progress-title">Günlük hedef</span>
            <span className="text-secondary text-sm">
              {dailyProgressCount.toLocaleString("tr-TR")} /{" "}
              {safeGoal.toLocaleString("tr-TR")} kart
            </span>
          </div>
          <div
            className="progress-bar"
            aria-label="Günlük hedef ilerleme çubuğu"
          >
            <span
              className="progress-bar__fill progress-bar__fill--goal"
              style={{ width: `${dailyProgressPct}%` }}
            />
          </div>
          <div className="vocabulary-hud__progress-meta">
            <span>{dailyProgressPct}% tamamlandı</span>
            <span>{outstandingLabel}</span>
          </div>
        </div>
      </div>

      {!!quickInsights?.length && (
        <div className="vocabulary-hud__insights">
          {quickInsights.slice(0, 2).map((insight) => (
            <div key={insight.label} className="vocabulary-hud__insight">
              <h3>{insight.label}</h3>
              <p className="vocabulary-hud__insight-value">{insight.value}</p>
              {insight.helper && (
                <p className="text-secondary text-sm">{insight.helper}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

VocabularyHud.propTypes = {
  aggregatedProgress: PropTypes.shape({
    totalQuizzes: PropTypes.number,
    accuracy: PropTypes.number,
    streak: PropTypes.number,
    xp: PropTypes.number,
  }),
  xpInfo: PropTypes.shape({
    level: PropTypes.number,
    xp: PropTypes.number,
    xpToNext: PropTypes.number,
    progressPct: PropTypes.number,
  }),
  averageSessionTime: PropTypes.number,
  dailyGoal: PropTypes.number,
  dailyProgress: PropTypes.number,
  outstandingReviews: PropTypes.number,
  quickInsights: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      helper: PropTypes.string,
    })
  ),
};

VocabularyHud.defaultProps = {
  aggregatedProgress: null,
  xpInfo: null,
  averageSessionTime: 0,
  dailyGoal: 0,
  dailyProgress: 0,
  outstandingReviews: 0,
  quickInsights: [],
};

export default VocabularyHud;
