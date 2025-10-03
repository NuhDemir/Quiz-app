import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import useGsapAnimations from "../hooks/useGsapAnimations";
import { apiRequest } from "../utils/apiClient";

const formatPercentage = (value) =>
  `${Math.min(Math.max(Math.round(value ?? 0), 0), 100)}%`;

const Metric = ({ label, value }) => (
  <div className="metric-card">
    <span className="metric-card__label">{label}</span>
    <span className="metric-card__value">{value}</span>
  </div>
);

const SessionItem = ({ session }) => (
  <li className="session-item">
    <div>
      <p className="session-item__title">{session.category || "Genel"}</p>
      <p className="session-item__meta">
        {new Date(session.takenAt).toLocaleDateString("tr-TR", {
          day: "numeric",
          month: "short",
        })}
        {" • "}
        Skor: {session.score ?? 0}
      </p>
    </div>
    <span className="session-item__badge">
      {formatPercentage(session.accuracy)}
    </span>
  </li>
);

const Progress = ({ userId: propUserId = "guest-user" }) => {
  const [progress, setProgress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const auth = useSelector((s) => s.auth);
  const containerRef = useRef(null);
  const barRef = useRef(null);
  const listRef = useRef(null);
  const { fadeIn, animateWidth, staggerList } = useGsapAnimations();

  const summaryMetrics = useMemo(() => {
    if (!progress) {
      return [];
    }

    return [
      {
        label: "Tamamlanan Quiz",
        value: progress.totalQuizzes ?? 0,
      },
      {
        label: "Doğruluk",
        value: formatPercentage(progress.accuracy),
      },
      {
        label: "XP",
        value: progress.xp ?? 0,
      },
      {
        label: "Seri",
        value: progress.streak ?? 0,
      },
    ];
  }, [progress]);

  useEffect(() => {
    const controller = new AbortController();
    const effectiveUserId = auth?.user?.id || propUserId;

    const fetchProgress = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Use apiRequest to auto-handle errors & optional token
        const data = await apiRequest(
          `progress?userId=${encodeURIComponent(effectiveUserId)}`,
          {
            method: "GET",
            token: auth?.token || undefined,
            signal: controller.signal,
          }
        );
        setProgress(data.progress);
      } catch (err) {
        if (err.name === "AbortError") return;
        setError(
          err.data?.error || err.message || "Beklenmeyen bir hata oluştu"
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchProgress();
    return () => controller.abort();
  }, [auth?.token, auth?.user?.id, propUserId]);

  useEffect(() => {
    if (!progress) return;

    const cardAnimation = fadeIn(containerRef.current, {
      from: { opacity: 0, y: 24 },
      to: { y: 0, duration: 0.6 },
    });

    const accuracy = Math.min(Math.max(progress.accuracy ?? 0, 0), 100);
    const barAnimation = animateWidth(
      barRef.current,
      `${Math.round(accuracy)}%`,
      {
        duration: 1,
        ease: "power3.out",
      }
    );

    const listAnimation = staggerList(listRef.current?.children || [], {
      offset: 16,
      duration: 0.5,
      stagger: 0.1,
      ease: "power3.out",
    });

    return () => {
      cardAnimation?.kill?.();
      barAnimation?.kill?.();
      listAnimation?.kill?.();
    };
  }, [progress, fadeIn, animateWidth, staggerList]);

  if (isLoading) {
    return (
      <div className="surface-card card-content progress-card__skeleton">
        <div className="skeleton skeleton--title" />
        <div className="skeleton skeleton--bar" />
        <div className="skeleton-row">
          <div className="skeleton skeleton--metric" />
          <div className="skeleton skeleton--metric" />
          <div className="skeleton skeleton--metric" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="surface-card card-content">
        <p className="error-text">{error}</p>
      </div>
    );
  }

  if (!progress) {
    return null;
  }

  const totalSessionCount = Array.isArray(progress.recentSessions)
    ? progress.recentSessions.length
    : 0;
  const recentSessions = Array.isArray(progress.recentSessions)
    ? progress.recentSessions.slice(0, 4)
    : [];
  const visibleSessionCount = recentSessions.length;

  return (
    <section
      ref={containerRef}
      className="surface-card card-content progress-card"
    >
      <header className="progress-card__header">
        <div>
          <h2 className="section-heading">İlerleme Özeti</h2>
          <p className="text-secondary">
            Güncel performansınız ve son quiz oturumlarınız burada listelenir.
          </p>
        </div>
        <span className="progress-card__badge">Canlı</span>
      </header>

      <div className="progress-card__bar">
        <div className="progress-card__bar-label">
          Toplam doğruluk
          <strong>{formatPercentage(progress.accuracy)}</strong>
        </div>
        <div className="progress-bar">
          <div ref={barRef} className="progress-bar__fill" />
        </div>
      </div>

      <div className="progress-card__metrics">
        {summaryMetrics.map((metric) => (
          <Metric
            key={metric.label}
            label={metric.label}
            value={metric.value}
          />
        ))}
      </div>

      <div className="progress-card__sessions">
        <div className="progress-card__sessions-header">
          <h3>Son oturumlar</h3>
          <span className="text-secondary">
            {visibleSessionCount} kayıt
            {totalSessionCount > visibleSessionCount
              ? ` / ${totalSessionCount}`
              : ""}
          </span>
        </div>
        {recentSessions.length ? (
          <ul ref={listRef} className="progress-card__session-list">
            {recentSessions.map((session, index) => (
              <SessionItem
                key={`${session.quizId || index}-${session.takenAt || index}`}
                session={session}
              />
            ))}
          </ul>
        ) : (
          <p className="text-secondary">Henüz bir quiz tamamlanmadı.</p>
        )}
      </div>
    </section>
  );
};

export default Progress;
