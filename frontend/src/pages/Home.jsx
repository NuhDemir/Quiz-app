import React, { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  PlayArrow as PlayIcon,
  TrendingUp as StatsIcon,
  Timeline as ProgressIcon,
  Schedule as TimeIcon,
  Whatshot as StreakIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
} from "@mui/icons-material";
import useGsapAnimations from "../hooks/useGsapAnimations";
import Progress from "../components/Progress";
import categories from "../data/categories.json";
import levels from "../data/levels.json";

const Home = ({ darkMode, toggleDarkMode }) => {
  const navigate = useNavigate();
  const { stats } = useSelector((state) => state.user);
  const headerRef = useRef(null);
  const statsRef = useRef(null);
  const actionsRef = useRef(null);
  const { slideUp, staggerList } = useGsapAnimations();

  const currentLevel = useMemo(() => {
    const accuracy = stats.accuracy || 0;
    return (
      levels.find(
        (level) => accuracy >= level.minAccuracy && accuracy < level.maxAccuracy
      ) || levels[0]
    );
  }, [stats.accuracy]);

  const statCards = useMemo(
    () => [
      {
        icon: <StatsIcon fontSize="inherit" />,
        colorClass: "bg-primary",
        label: "Toplam Quiz",
        value: stats.totalQuizzes || 0,
      },
      {
        icon: <ProgressIcon fontSize="inherit" />,
        colorClass: "bg-success",
        label: "Doğruluk",
        value: `%${Math.round(stats.accuracy || 0)}`,
      },
      {
        icon: <StreakIcon fontSize="inherit" />,
        colorClass: "bg-warning",
        label: "Seri",
        value: stats.streak || 0,
      },
      {
        icon: <TimeIcon fontSize="inherit" />,
        colorClass: "bg-danger",
        label: "Ortalama Süre",
        value: `${stats.averageTime || 0}s`,
      },
    ],
    [stats]
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

  const quickStartQuiz = () => {
    const randomCategory =
      categories[Math.floor(Math.random() * categories.length)];
    const randomLevel = levels[Math.floor(Math.random() * levels.length)];

    navigate(`/quiz/${randomCategory.id}`, {
      state: { level: randomLevel.id },
    });
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
        <h2 className="section-heading">İstatistikleriniz</h2>
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
      </section>

      <section>
        <Progress userId={stats?.userId || "guest-user"} />
      </section>
    </div>
  );
};

export default Home;
