import React from "react";

const StatsPeerComparison = ({ rows = [], loading }) => {
  return (
    <section className="stats-section">
      <div className="section-heading-row">
        <h2 className="section-heading">Topluluk Karşılaştırması</h2>
        <span className="text-secondary stats-section__hint">
          İlk 10 oyuncu ile performansını kıyasla
        </span>
      </div>
      <div className="surface-card stats-table-card">
        {loading ? (
          <div className="stats-table-card__empty">
            Liderboard yükleniyor...
          </div>
        ) : rows.length ? (
          <div className="stats-table-wrapper">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Kullanıcı</th>
                  <th>XP</th>
                  <th>Doğruluk</th>
                  <th>Quiz</th>
                  <th>Seri</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.userId || row.username}
                    className={
                      row.isCurrentUser ? "is-current-user" : undefined
                    }
                  >
                    <td>{row.rank}</td>
                    <td>{row.username}</td>
                    <td>{row.points}</td>
                    <td>%{Math.round(row.accuracy || 0)}</td>
                    <td>{row.totalQuizzes}</td>
                    <td>{row.longestStreak}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="stats-table-card__empty">
            Topluluk verisi alınamadı.
          </div>
        )}
      </div>
    </section>
  );
};

export default StatsPeerComparison;
