import React, { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import useProfileAnimations from "../hooks/useProfileAnimations";
import { fetchProfile, fetchAttempts } from "../store/userSlice";
import badgesData from "../data/badges.json";

const numberFormatter = new Intl.NumberFormat("tr-TR");
const badgesLookup = new Map(badgesData.map((badge) => [badge.id, badge]));

const formatNumber = (value) => numberFormatter.format(value ?? 0);
const formatPercentage = (value) => `${Math.round(value ?? 0)}%`;
const formatDateLong = (value) =>
  value
    ? new Date(value).toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";
const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("tr-TR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const Profile = () => {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const profile = useSelector((s) => s.user.profile);
  const loading = useSelector((s) => s.user.profileLoading);
  const error = useSelector((s) => s.user.profileError);

  const heroRef = useRef(null);
  const metricGridRef = useRef(null);
  const badgeGridRef = useRef(null);
  const xpFillRef = useRef(null);
  const xpCardRef = useRef(null);

  const {
    animateHero,
    revealMetrics,
    revealBadges,
    pulseHighlight,
    fillProgressBar,
  } = useProfileAnimations();

  useEffect(() => {
    if (token) {
      dispatch(fetchProfile(token));
      dispatch(fetchAttempts({ token, limit: 10 }));
    }
  }, [token, dispatch]);

  useEffect(() => {
    if (!profile) return undefined;

    const heroAnimation = animateHero(heroRef.current);

    const metricElements = metricGridRef.current?.children || [];
    const metricAnimation =
      metricElements.length > 0 ? revealMetrics(metricElements) : null;

    const badgeElements = badgeGridRef.current?.children || [];
    const badgeAnimation =
      badgeElements.length > 0 ? revealBadges(badgeElements) : null;

    const fillAnimation = fillProgressBar(
      xpFillRef.current,
      profile?.insights?.xpProgress ?? 0,
      { reset: true }
    );

    const pulseAnimation = pulseHighlight(xpCardRef.current, { scale: 1.01 });

    return () => {
      heroAnimation?.kill?.();
      metricAnimation?.kill?.();
      badgeAnimation?.kill?.();
      fillAnimation?.kill?.();
      pulseAnimation?.kill?.();
    };
  }, [
    profile,
    animateHero,
    revealMetrics,
    revealBadges,
    fillProgressBar,
    pulseHighlight,
  ]);

  const metricCards = useMemo(() => {
    const progress = profile?.progress || {};
    return [
      {
        key: "totalQuizzes",
        label: "Tamamlanan Quiz",
        value: formatNumber(progress.totalQuizzes),
        helper: "Toplam tamamlanan quiz sayısı",
      },
      {
        key: "accuracy",
        label: "Doğruluk",
        value: formatPercentage(progress.accuracy),
        helper: "Genel başarı yüzdesi",
      },
      {
        key: "xp",
        label: "Toplam XP",
        value: formatNumber(progress.xp),
        helper: "Kazanılan toplam deneyim puanı",
      },
      {
        key: "streak",
        label: "Aktif Seri",
        value: `${formatNumber(progress.streak)} gün`,
        helper: "Art arda geçen başarılı gün sayısı",
      },
    ];
  }, [profile]);

  const enrichedBadges = useMemo(() => {
    const ids = profile?.progress?.badges || [];
    return ids.slice(0, 6).map((id) => {
      const details = badgesLookup.get(id) || {};
      return {
        id,
        icon: details.icon || "🏅",
        name: details.nameTr || details.name || id,
        description: details.descriptionTr || details.description || "",
        color: details.color || "#0a84ff",
      };
    });
  }, [profile]);

  const recentSessions = useMemo(
    () => profile?.progress?.recentSessions?.slice(0, 5) || [],
    [profile]
  );

  const insightItems = useMemo(() => {
    if (!profile) return [];
    const { insights, progress } = profile;
    const streakLabel = `${formatNumber(progress?.streak ?? 0)} gün`;
    const accuracyLabel =
      insights?.recentAccuracy != null
        ? `${Number(insights.recentAccuracy).toFixed(1).replace(".0", "")} %`
        : "Veri yok";

    return [
      {
        label: "Streak durumu",
        value: streakLabel,
        meta: insights?.streakTier,
      },
      {
        label: "Son etkinlik",
        value: formatDateTime(insights?.lastActiveAt),
        meta: "Son oturum zamanı",
      },
      {
        label: "Son doğruluk ortalaması",
        value: accuracyLabel,
        meta: "Son oturumların ortalaması",
      },
    ];
  }, [profile]);

  const handleRetry = () => {
    if (token) dispatch(fetchProfile(token));
  };

  if (loading) {
    return (
      <div className="profile-page layout-wrapper">
        <div className="profile-skeleton">
          <div className="skeleton skeleton--hero" />
          <div className="skeleton skeleton--grid" />
          <div className="skeleton skeleton--section" />
          <div className="skeleton skeleton--section" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page layout-wrapper">
        <section className="profile-section">
          <div className="profile-section__header">
            <h2>Profil yüklenemedi</h2>
          </div>
          <p className="text-secondary">{error}</p>
          <div className="profile-hero__actions">
            <button
              type="button"
              className="primary-button"
              onClick={handleRetry}
            >
              Tekrar dene
            </button>
            <Link to="/settings" className="secondary-button">
              Ayarlara git
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const { user, progress, insights } = profile;
  const avatarLabel = user?.username?.[0]?.toUpperCase() || "👤";

  return (
    <div className="profile-page layout-wrapper">
      <section ref={heroRef} className="profile-hero">
        <div className="profile-hero__content">
          <div className="profile-hero__top">
            <div className="profile-hero__identity">
              <div className="profile-hero__avatar" aria-hidden="true">
                {avatarLabel}
              </div>
              <div className="profile-hero__heading">
                <h1 className="profile-hero__title">{user?.username}</h1>
                <p className="profile-hero__subtitle">{user?.email}</p>
              </div>
            </div>
            <div className="profile-hero__actions">
              <Link to="/categories" className="primary-button">
                Quiz Başlat
              </Link>
              <Link to="/settings" className="secondary-button">
                Tercihler
              </Link>
            </div>
          </div>

          <div className="profile-hero__meta">
            <span>Üyelik: {formatDateLong(user?.createdAt)}</span>
            <span>Seviye {insights?.xpLevel ?? 1}</span>
            <span>{progress?.badges?.length || 0} rozet</span>
          </div>
        </div>
      </section>

      <section ref={metricGridRef} className="profile-metric-grid">
        {metricCards.map((card) => (
          <article key={card.key} className="profile-metric-card">
            <h3>{card.label}</h3>
            <strong>{card.value}</strong>
            <p>{card.helper}</p>
          </article>
        ))}
      </section>

      <section className="profile-layout">
        <div className="profile-panel">
          <article ref={xpCardRef} className="profile-section">
            <div className="profile-section__header">
              <h2>Seviye ilerlemesi</h2>
              <span>
                {formatNumber(insights?.xpToNext ?? 0)} XP sonra seviye{" "}
                {(insights?.xpLevel ?? 1) + 1}
              </span>
            </div>
            <div className="profile-progress-bar">
              <div ref={xpFillRef} className="profile-progress-bar__fill" />
            </div>
            <div className="flex-between">
              <span className="text-secondary">
                Başlangıç: {formatNumber(insights?.levelFloorXp ?? 0)} XP
              </span>
              <span className="text-secondary">
                Hedef: {formatNumber(insights?.nextLevelXp ?? 0)} XP
              </span>
            </div>
          </article>

          <article className="profile-section">
            <div className="profile-section__header">
              <h2>Rozetler</h2>
              <span>
                {enrichedBadges.length} / {progress?.badges?.length || 0}
              </span>
            </div>
            {enrichedBadges.length ? (
              <div ref={badgeGridRef} className="profile-badge-grid">
                {enrichedBadges.map((badge) => (
                  <div key={badge.id} className="profile-badge">
                    <div
                      className="profile-badge__icon"
                      style={{
                        background: `${badge.color}22`,
                        color: badge.color,
                      }}
                    >
                      {badge.icon}
                    </div>
                    <div className="profile-badge__body">
                      <p className="profile-badge__title">{badge.name}</p>
                      <p className="profile-badge__meta">{badge.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="profile-empty">Henüz rozet kazanılmadı.</p>
            )}
          </article>
        </div>

        <div className="profile-panel">
          <article className="profile-section">
            <div className="profile-section__header">
              <h2>Son aktiviteler</h2>
              <span>{recentSessions.length} kayıt</span>
            </div>
            {recentSessions.length ? (
              <ul className="profile-activity__list">
                {recentSessions.map((session, index) => (
                  <li
                    key={`${session.quizId || index}-${
                      session.takenAt || index
                    }`}
                    className="profile-activity__item"
                  >
                    <div>
                      <strong>{session.category || "Genel"}</strong>
                      <span>{formatDateTime(session.takenAt)}</span>
                    </div>
                    <div className="chip chip--accent">
                      Skor {formatNumber(session.score ?? 0)} ·{" "}
                      {formatPercentage(session.accuracy)}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="profile-empty">Henüz oturum kaydı yok.</p>
            )}
          </article>

          <article className="profile-section">
            <div className="profile-section__header">
              <h2>İçgörüler</h2>
              <span>Canlı veriler</span>
            </div>
            <div className="profile-activity">
              <ul className="profile-activity__list">
                {insightItems.map((item) => (
                  <li key={item.label} className="profile-activity__item">
                    <div>
                      <strong>{item.value}</strong>
                      <span>{item.label}</span>
                    </div>
                    {item.meta && <span>{item.meta}</span>}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
};

export default Profile;
