import React from "react";
import { TimelineIcon, TimeIcon, StreakIcon } from "../icons";

const StatsRecentSessions = ({ sessions = [] }) => {
  if (!sessions.length) {
    return (
      <section className="stats-section">
        <h2 className="section-heading">Son Oturumlar</h2>
        <div className="surface-card stats-table-card">
          <div className="stats-table-card__empty">
            Son oturum verisi bulunamadı. Quiz çözmeye başla!
          </div>
        </div>
      </section>
    );
  }

  const recentSessions = sessions.slice(0, 4);

  return (
    <section className="stats-section">
      <h2 className="section-heading">Son Oturumlar</h2>
      <div className="stats-session-list">
        {recentSessions.map((session, index) => {
          const sessionDate = session.takenAt
            ? new Date(session.takenAt).toLocaleString("tr-TR", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "-";

          return (
            <div
              key={`${session.takenAt || session.quizId || "session"}-${index}`}
              className="surface-card stats-session-card"
            >
              <div className="stats-session-card__header">
                <div>
                  <p className="stats-session-card__title">
                    {session.category || "Genel"}
                  </p>
                  <p className="stats-session-card__date text-secondary">
                    {sessionDate}
                  </p>
                </div>
                <span className="stats-session-card__score">
                  %{Math.round(session.accuracy ?? session.score ?? 0)}
                </span>
              </div>
              <div className="stats-session-card__meta">
                <span>
                  <TimelineIcon fontSize="inherit" /> Doğru Yanıt:{" "}
                  {session.score ?? session.accuracy ?? 0}%
                </span>
                <span>
                  <TimeIcon fontSize="inherit" /> Süre:{" "}
                  {session.duration || session.durationSec || 0}s
                </span>
                <span>
                  <StreakIcon fontSize="inherit" /> Seri değişimi:{" "}
                  {session.streakDelta || 0}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default StatsRecentSessions;
