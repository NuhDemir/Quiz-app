import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchLeaderboard } from "../store/leaderboardSlice";
import {
  TrophyIcon,
  SilverMedalIcon,
  BronzeMedalIcon,
} from "../components/icons";

const Leaderboard = () => {
  const dispatch = useDispatch();
  const { items, loading, error, lastUpdated } = useSelector(
    (s) => s.leaderboard
  );

  useEffect(() => {
    if (!items.length && !loading) {
      dispatch(fetchLeaderboard({ limit: 50 }));
    }
  }, [dispatch, items.length, loading]);

  const podium = useMemo(() => items.slice(0, 3), [items]);
  const rest = useMemo(() => items.slice(3), [items]);

  return (
    <div className="layout-wrapper leaderboard-page">
      <div className="surface-card card-content leaderboard-header">
        <h1 className="leaderboard-header__title">Liderlik Tablosu</h1>
        <p className="leaderboard-header__subtitle">
          En iyi performans gösteren kullanıcılar.{" "}
          {lastUpdated && (
            <span className="opacity-70">
              (Güncellendi: {new Date(lastUpdated).toLocaleTimeString()})
            </span>
          )}
        </p>
      </div>
      {loading && (
        <div className="surface-card p-4 rounded-xl text-center">
          Yükleniyor...
        </div>
      )}
      {error && !loading && (
        <div className="surface-card p-4 rounded-xl text-center text-red-500">
          Hata: {error}
          <button
            type="button"
            className="secondary-button mt-3"
            onClick={() => dispatch(fetchLeaderboard({ limit: 50 }))}
          >
            Yeniden Dene
          </button>
        </div>
      )}
      {!loading && !error && (
        <>
          <div className="leaderboard-podium">
            {podium.map((row, idx) => {
              const place = idx + 1;
              const accuracy =
                row.accuracy != null
                  ? Math.round(row.accuracy)
                  : row.correctCount != null && row.totalQuestions
                  ? Math.round(
                      (row.correctCount / Math.max(1, row.totalQuestions)) * 100
                    )
                  : 0;
              const podiumClasses = [
                "podium--gold",
                "podium--silver",
                "podium--bronze",
              ];
              const podiumIconComponents = [
                TrophyIcon,
                SilverMedalIcon,
                BronzeMedalIcon,
              ];
              const PodiumIcon = podiumIconComponents[idx] || TrophyIcon;
              return (
                <div
                  key={row.userId || row.id || idx}
                  className={`leaderboard-podium__card ${podiumClasses[idx]}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ fontSize: "1.75rem" }} aria-hidden="true">
                      <PodiumIcon fontSize="large" />
                    </span>
                    <span className="leaderboard-podium__badge">#{place}</span>
                  </div>
                  <h3 className="font-semibold leading-snug text-base">
                    {row.username || row.name || row.email || "Anon"}
                  </h3>
                  <div className="leaderboard-podium__meta">
                    <div className="leaderboard-podium__stat">
                      <span>SKOR</span>
                      <span>{row.score || row.points || 0}</span>
                    </div>
                    <div className="leaderboard-podium__stat">
                      <span>DOĞRULUK</span>
                      <span>%{accuracy}</span>
                    </div>
                    <div className="leaderboard-podium__stat">
                      <span>QUIZ</span>
                      <span>
                        {row.quizzes || row.quizCount || row.totalQuizzes || 0}
                      </span>
                    </div>
                    <div className="leaderboard-podium__stat">
                      <span>PUAN</span>
                      <span>{row.points || row.score || 0}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {!podium.length && (
              <div className="surface-card p-6 rounded-xl text-center opacity-70 col-span-full">
                Veri yok
              </div>
            )}
          </div>
          <div className="leaderboard-table-wrapper">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Kullanıcı</th>
                  <th>Skor</th>
                  <th>Quiz</th>
                  <th>Doğruluk</th>
                </tr>
              </thead>
              <tbody>
                {rest.map((row, idx) => {
                  const globalIndex = idx + 4; // top 3 consumed
                  const accuracy =
                    row.accuracy != null
                      ? Math.round(row.accuracy)
                      : row.correctCount != null && row.totalQuestions
                      ? Math.round(
                          (row.correctCount / Math.max(1, row.totalQuestions)) *
                            100
                        )
                      : 0;
                  return (
                    <tr key={row.userId || row.id || globalIndex}>
                      <td>{globalIndex}</td>
                      <td>{row.username || row.name || row.email || "Anon"}</td>
                      <td>{row.score || row.points || 0}</td>
                      <td>
                        {row.quizzes || row.quizCount || row.totalQuizzes || 0}
                      </td>
                      <td>%{accuracy}</td>
                    </tr>
                  );
                })}
                {!rest.length && !!podium.length && (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: "1rem",
                        textAlign: "center",
                        opacity: 0.7,
                      }}
                    >
                      Diğer kayıt yok
                    </td>
                  </tr>
                )}
                {!items.length && (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: "1rem",
                        textAlign: "center",
                        opacity: 0.7,
                      }}
                    >
                      Veri yok
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default Leaderboard;
