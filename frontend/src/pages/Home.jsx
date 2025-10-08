import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  PlayIcon,
  StatsIcon,
  TimelineIcon,
  TimeIcon,
  StreakIcon,
  DarkModeIcon,
  LightModeIcon,
  TrophyIcon,
  TargetIcon,
  LeaderboardIcon,
} from "../components/icons";
import useGsapAnimations from "../hooks/useGsapAnimations";
import Progress from "../components/Progress";
import categories from "../data/categories.json"; // still used for fallback mapping if needed
import levels from "../data/levels.json";
import { fetchQuizList } from "../store/quizSlice";
import { fetchAttempts, fetchProgress } from "../store/userSlice";
import {
  buildAggregatedProgress,
  computeAverageSessionTime,
  buildXpLevelInfo,
  buildQuickInsights,
} from "../utils/statsHelpers";

const Home = ({ darkMode, toggleDarkMode }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { stats, attempts, progress } = useSelector((state) => state.user);
  const { user, token } = useSelector((state) => state.auth);
  const userId = user?._id || user?.id || user?.userId;
  const {
    list: quizList,
    listLoading: quizListLoading,
    listLoaded: quizListLoaded,
  } = useSelector((state) => state.quiz);
  const headerRef = useRef(null);
  const statsRef = useRef(null);
  const actionsRef = useRef(null);
  const { slideUp, staggerList } = useGsapAnimations();
  const [progressRequested, setProgressRequested] = useState(false);

  useEffect(() => {
    setProgressRequested(false);
  }, [userId]);

  const aggregatedProgress = useMemo(
    () => buildAggregatedProgress({ progress, stats, attempts }),
    [progress, stats, attempts]
  );

  const currentLevel = useMemo(() => {
    const accuracy = aggregatedProgress.accuracy || 0;
    return (
      levels.find(
        (level) => accuracy >= level.minAccuracy && accuracy < level.maxAccuracy
      ) || levels[0]
    );
  }, [aggregatedProgress.accuracy]);

  const averageSessionTime = useMemo(
    () => computeAverageSessionTime(aggregatedProgress.recentSessions),
    [aggregatedProgress.recentSessions]
  );

  const xpLevelInfo = useMemo(
    () => buildXpLevelInfo(aggregatedProgress.xp),
    [aggregatedProgress.xp]
  );

  const statCards = useMemo(
    () => [
      {
        icon: <StatsIcon fontSize="inherit" />,
        colorClass: "bg-primary",
        label: "Toplam Quiz",
        value: aggregatedProgress.totalQuizzes || 0,
      },
      {
        icon: <TimelineIcon fontSize="inherit" />,
        colorClass: "bg-success",
        label: "Doğruluk",
        value: `%${Math.round(aggregatedProgress.accuracy || 0)}`,
      },
      {
        icon: <StreakIcon fontSize="inherit" />,
        colorClass: "bg-warning",
        label: "Seri",
        value: aggregatedProgress.streak || 0,
      },
      {
        icon: <TimeIcon fontSize="inherit" />,
        colorClass: "bg-danger",
        label: "Ortalama Süre",
        value: `${averageSessionTime || 0}s`,
      },
      {
        icon: <TrophyIcon fontSize="inherit" />,
        colorClass: "bg-primary",
        label: "XP",
        value: aggregatedProgress.xp || 0,
      },
      {
        icon: <TargetIcon fontSize="inherit" />,
        colorClass: "bg-success",
        label: "Seviye",
        value: xpLevelInfo.level,
      },
    ],
    [aggregatedProgress, averageSessionTime, xpLevelInfo.level]
  );

  const quickInsights = useMemo(
    () => buildQuickInsights(aggregatedProgress),
    [aggregatedProgress]
  );

  useEffect(() => {
    const headerAnimation = slideUp(headerRef.current, {
      offset: 30,
      duration: 0.8,
      ease: "power3.out",
    });

    const statElements =
      statsRef.current?.querySelectorAll(".stats-card") || [];
    const statsAnimation = staggerList(statElements, {
      offset: 20,
      duration: 0.6,
      ease: "back.out(1.7)",
      stagger: 0.1,
    });

    const actionElements = actionsRef.current?.querySelectorAll("button") || [];
    const actionAnimation = staggerList(actionElements, {
      duration: 0.5,
      ease: "back.out(1.7)",
      stagger: 0.1,
      from: { scale: 0.9 },
      to: { scale: 1 },
    });

    return () => {
      headerAnimation?.kill?.();
      statsAnimation?.kill?.();
      actionAnimation?.kill?.();
    };
  }, [slideUp, staggerList]);

  // Fetch quizzes & attempts on mount (only if not already loaded)
  useEffect(() => {
    if (!quizListLoaded && !quizListLoading) {
      dispatch(fetchQuizList());
    }
    const effectiveToken = token || localStorage.getItem("token");
    if (effectiveToken && !attempts.items.length && !attempts.loading) {
      dispatch(fetchAttempts({ token: effectiveToken, limit: 5 }));
    }
  }, [
    dispatch,
    quizListLoaded,
    quizListLoading,
    attempts.items.length,
    attempts.loading,
    token,
  ]);

  useEffect(() => {
    if (!userId || progressRequested) return;
    dispatch(fetchProgress({ userId }));
    setProgressRequested(true);
  }, [dispatch, progressRequested, userId]);

  // Derive a recommended quiz (e.g., least attempted category or first list item)
  const recommendedQuiz = useMemo(() => {
    if (quizList && quizList.length) {
      // Simple heuristic: pick the quiz with lowest attempts count if provided
      const sorted = [...quizList].sort(
        (a, b) => (a.attempts || 0) - (b.attempts || 0)
      );
      return sorted[0];
    }
    return null;
  }, [quizList]);

  const quickStartQuiz = () => {
    // Prefer recommended quiz; fallback to any quiz; fallback to random category id
    if (recommendedQuiz?._id || recommendedQuiz?.id) {
      navigate(`/quiz/${recommendedQuiz._id || recommendedQuiz.id}`);
      return;
    }
    const randomCategory =
      categories[Math.floor(Math.random() * categories.length)];
    navigate(`/quiz/${randomCategory.id}`);
  };

  return (
    <div className="home-page layout-wrapper">
      <section
        ref={headerRef}
        className="surface-card card-content home-header"
      >
        <div className="home-header__top">
          <div>
            <h1 className="home-header__title">Hoş geldiniz</h1>
            <p className="home-header__subtitle">
              Bugün öğrenmeye devam etmeye hazır mısınız?
            </p>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={toggleDarkMode}
            aria-label="Tema değiştir"
          >
            {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </button>
        </div>
        <div className="chip-row">
          <span className="chip">{currentLevel.name}</span>
          <span className="text-secondary">{currentLevel.description}</span>
        </div>
      </section>

      <section ref={statsRef} className="home-section">
        <div className="section-heading-row">
          <h2 className="section-heading">İstatistikleriniz</h2>
          <button
            type="button"
            className="link-button"
            onClick={() => navigate("/stats")}
          >
            Daha Fazlasını Gör
            <LeaderboardIcon fontSize="small" className="button-icon" />
          </button>
        </div>
        <div className="stats-grid">
          {statCards.map((card) => (
            <div key={card.label} className="surface-card stats-card">
              <div className={`avatar-circle ${card.colorClass}`}>
                {card.icon}
              </div>
              <p className="stats-card__value">{card.value}</p>
              <p className="text-secondary">{card.label}</p>
            </div>
          ))}
        </div>
        <div className="stats-summary-grid">
          {quickInsights.map((item) => (
            <div key={item.label} className="surface-card stats-summary-card">
              <span className="stats-summary-card__label">{item.label}</span>
              <span className="stats-summary-card__value">{item.value}</span>
              <span className="stats-summary-card__hint text-secondary">
                {item.helper}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="home-section">
        <h2 className="section-heading">Başlamak için seçenekler</h2>
        <div ref={actionsRef} className="home-actions">
          <button
            type="button"
            className="primary-button"
            onClick={quickStartQuiz}
          >
            Hızlı Başla
            <PlayIcon className="button-icon" />
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate("/categories")}
          >
            Quiz Kütüphanesi
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate("/leaderboard")}
          >
            İlerlemeyi Gör
          </button>
        </div>
        {recommendedQuiz && (
          <div
            className="surface-card card-content"
            style={{ marginTop: "1rem" }}
          >
            <h3 className="text-lg font-semibold mb-1">Önerilen Quiz</h3>
            <p className="text-secondary text-sm mb-2">
              Daha az denediğiniz bir konuya odaklanın.
            </p>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">
                  {recommendedQuiz.title || recommendedQuiz.name || "Quiz"}
                </p>
                {recommendedQuiz.category && (
                  <p className="text-secondary text-xs mt-0.5">
                    Kategori: {recommendedQuiz.category}
                  </p>
                )}
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  navigate(`/quiz/${recommendedQuiz._id || recommendedQuiz.id}`)
                }
              >
                Başla
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="home-section"></section>
    </div>
  );
};

export default Home;
