import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import categories from "../data/categories.json";
import levels from "../data/levels.json";
import { fetchQuizList } from "../store/quizSlice";
import { fetchProgress } from "../store/userSlice";
import {
  LibraryBooksIcon,
  ExploreIcon,
  VerifiedIcon,
  BoltIcon,
  CalculateIcon,
  TargetIcon,
  ProgressIcon,
  SpellcheckIcon,
  TextFieldsIcon,
  MenuBookIcon,
  AccountTreeIcon,
  EmojiObjectsIcon,
  LooksOneIcon,
  LooksTwoIcon,
  Looks3Icon,
  Looks4Icon,
  Looks5Icon,
  Looks6Icon,
} from "../components/icons";

const categoryIconMap = {
  Spellcheck: SpellcheckIcon,
  TextFields: TextFieldsIcon,
  MenuBook: MenuBookIcon,
  AccountTree: AccountTreeIcon,
  EmojiObjects: EmojiObjectsIcon,
};

const levelIconMap = {
  A1: LooksOneIcon,
  A2: LooksTwoIcon,
  B1: Looks3Icon,
  B2: Looks4Icon,
  C1: Looks5Icon,
  C2: Looks6Icon,
};

// Helper to derive recommendation (least attempted or lowest accuracy)
function deriveRecommendation(progress, localStats) {
  const catStats = progress?.categoryStats || localStats?.categoryStats || {};
  let best = null;
  Object.keys(catStats).forEach((k) => {
    const acc = catStats[k]?.accuracy ?? 0;
    if (!best || acc < best.acc) best = { id: k, acc };
  });
  if (best) return best.id;
  // fallback first category id
  return categories[0]?.id;
}

const Categories = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, listLoading, listError, listLoaded } = useSelector(
    (s) => s.quiz
  );
  const { progress, stats } = useSelector((s) => s.user);
  const { user } = useSelector((s) => s.auth);

  const quizList = useMemo(() => {
    if (Array.isArray(list)) return list;
    if (list && Array.isArray(list.items)) return list.items;
    return [];
  }, [list]);

  // Fetch quizzes & progress on mount
  useEffect(() => {
    if (!listLoaded && !listLoading) {
      dispatch(fetchQuizList());
    }
  }, [dispatch, listLoaded, listLoading]);

  useEffect(() => {
    if (user && !progress) {
      dispatch(fetchProgress({ userId: user._id || user.id }));
    }
  }, [dispatch, user, progress]);

  const recommendation = useMemo(
    () => deriveRecommendation(progress, stats),
    [progress, stats]
  );

  // Build category progress metrics merging server progress & local stats
  const categoryProgress = useMemo(() => {
    // Prefer server-provided categoryStats (already normalized in progress endpoint)
    if (progress?.categoryStats && Object.keys(progress.categoryStats).length) {
      const serverMap = {};
      Object.entries(progress.categoryStats).forEach(([id, v]) => {
        serverMap[id] = {
          accuracy: v.accuracy ?? 0,
          attempts: v.attempts ?? 0,
          correct: v.correct ?? 0,
        };
      });
      return serverMap;
    }
    // Fallback to locally accumulated stats
    const localMap = {};
    Object.entries(stats.categoryStats || {}).forEach(([id, v]) => {
      localMap[id] = {
        accuracy: v.accuracy || 0,
        attempts: v.totalQuestions
          ? Math.max(1, Math.round(v.totalQuestions / 10))
          : 0,
        correct: v.correctAnswers || 0,
      };
    });
    return localMap;
  }, [stats, progress]);

  // Build quiz count per category & first quiz mapping
  const quizCategoryIndex = useMemo(() => {
    const counts = {};
    const firstQuiz = {};
    quizList.forEach((q) => {
      const cat = q.category || "general";
      if (!counts[cat]) counts[cat] = 0;
      counts[cat] += 1;
      if (!firstQuiz[cat]) firstQuiz[cat] = q; // keep first encountered
    });
    return { counts, firstQuiz };
  }, [quizList]);

  const summaryCards = useMemo(() => {
    const totalQuizzes =
      progress?.totalQuizzes ??
      Object.values(categoryProgress).reduce(
        (acc, item) => acc + (item?.attempts || 0),
        0
      );
    const accuracyValue = progress?.accuracy ?? stats.accuracy ?? 0;
    const streakValue = progress?.streak ?? stats.streak ?? 0;
    const correctAnswers = stats.correctAnswers || 0;
    const cards = [
      {
        label: "Çözülen quiz",
        value: totalQuizzes,
        hint: "Tamamladığınız oturum sayısı",
      },
      {
        label: "Ortalama doğruluk",
        value: `%${Math.round(accuracyValue)}`,
        hint: "Tüm kategorilerdeki başarı oranınız",
      },
      {
        label: "Seri",
        value: streakValue,
        hint: "Art arda başarılı gün sayısı",
      },
    ];
    if (correctAnswers > 0) {
      cards.push({
        label: "Doğru cevap",
        value: correctAnswers,
        hint: "Toplam doğru yanıt sayınız",
      });
    }
    return cards;
  }, [progress, stats, categoryProgress]);

  const focusCategories = useMemo(() => {
    const entries = Object.entries(categoryProgress);
    if (!entries.length) return [];
    return entries
      .sort((a, b) => (a[1].accuracy ?? 101) - (b[1].accuracy ?? 101))
      .slice(0, 3)
      .map(([id, value]) => ({
        id,
        label: categories.find((cat) => cat.id === id)?.nameTr || id,
        accuracy: value.accuracy ?? 0,
      }));
  }, [categoryProgress]);

  const recommendedCategory = useMemo(
    () => categories.find((cat) => cat.id === recommendation),
    [recommendation]
  );
  const recommendedAccuracy =
    categoryProgress[recommendation]?.accuracy ?? null;
  const recommendedQuizCount = quizCategoryIndex.counts[recommendation] || 0;

  const handleCategoryClick = (id) => {
    const catMeta = categories.find((cat) => cat.id === id);
    if (catMeta?.pagePath) {
      navigate(catMeta.pagePath);
      return;
    }
    const direct = quizCategoryIndex.firstQuiz[id];
    if (direct) {
      navigate(`/quiz/${direct._id || direct.id || direct.slug}`);
      return;
    }
    // Fallback old logic: any quiz whose slug or _id equals id
    const quiz = quizList.find(
      (q) => q.slug === id || q._id === id || q.id === id
    );
    if (quiz) {
      navigate(`/quiz/${quiz._id || quiz.id || quiz.slug}`);
    } else {
      navigate(`/quiz/${id}`);
    }
  };

  return (
    <div className="categories-page layout-wrapper">
      <section className="surface-card card-content categories-header">
        <div className="categories-header__top">
          <div className="categories-header__info">
            <span className="chip chip--accent">Çalışma rehberi</span>
            <h1 className="categories-header__title">
              Hangi beceriyi geliştirmek istersiniz?
            </h1>
            <p className="categories-header__subtitle">
              Quiz uygulamamız, her kategoriyi Türkçe açıklamalarla ve günlük
              konuşmalarla destekler. Aşağıda güçlü ve gelişmeye açık
              konularınızı özet halinde görebilir, tek dokunuşla yeni bir
              quiz&apos;e başlayabilirsiniz.
            </p>
            <div className="category-chip-row">
              <span className="category-chip">
                <span className="category-chip__icon" aria-hidden="true">
                  <LibraryBooksIcon fontSize="inherit" />
                </span>
                Toplam {categories.length} kategori
              </span>
              <span className="category-chip">
                <span className="category-chip__icon" aria-hidden="true">
                  <ExploreIcon fontSize="inherit" />
                </span>
                Akıllı öneri: {recommendedCategory?.nameTr || recommendation}
              </span>
              <span className="category-chip">
                <span className="category-chip__icon" aria-hidden="true">
                  <VerifiedIcon fontSize="inherit" />
                </span>
                Ortalama doğruluk %
                {Math.round(progress?.accuracy ?? stats.accuracy ?? 0)}
              </span>
            </div>
          </div>
          <div className="categories-header__highlight">
            <span className="categories-header__badge">
              <span>✨</span> Önerilen adım
            </span>
            <div className="categories-header__highlight-title">
              {recommendedCategory?.nameTr || "Yeni bir kategori seçin"}
            </div>
            <p className="categories-header__highlight-description">
              {recommendedCategory ? (
                <>
                  Bu kategoride başarı oranınız %
                  {Math.round(recommendedAccuracy ?? 0)}.{" "}
                  {recommendedQuizCount > 0
                    ? `Hazır ${recommendedQuizCount} quiz sizi bekliyor.`
                    : "Hazırlanan quizler yakında eklenecek."}
                </>
              ) : (
                "Hazırladığımız kategorilerden biriyle başlayarak kişisel planınızı oluşturabilirsiniz."
              )}
            </p>
            <button
              className="primary-button"
              onClick={() =>
                handleCategoryClick(recommendedCategory?.id || "grammar")
              }
            >
              Şimdi başla
            </button>
            <button
              className="secondary-button"
              onClick={() => navigate("/leaderboard")}
            >
              İlerlememi gör
            </button>
          </div>
        </div>
        <ul className="categories-header__list">
          <li>
            Her quiz sorusu, Türkçe açıklamalar ve ipuçlarıyla desteklenir.
          </li>
          <li>
            Kategoriler seviyeye göre gruplanır; dil becerilerinizi adım adım
            geliştirirsiniz.
          </li>
          <li>
            İlerlemeniz otomatik kaydedilir; kaldığınız yerden devam etmek
            sadece bir dokunuş.
          </li>
        </ul>
        {listError && (
          <div className="text-sm text-red-500 mt-4">Hata: {listError}</div>
        )}
      </section>

      <section className="categories-section">
        <h2 className="section-heading">İlerlemenizin özeti</h2>
        <div className="category-summary-grid">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="surface-card category-summary-card"
            >
              <span className="category-summary-card__label">{card.label}</span>
              <span className="category-summary-card__value">{card.value}</span>
              <span className="category-summary-card__hint">{card.hint}</span>
            </div>
          ))}
        </div>
        {focusCategories.length > 0 && (
          <div>
            <p className="text-sm text-secondary mt-3 mb-2">
              Daha fazla pratik önerdiğimiz kategoriler:
            </p>
            <div className="category-chip-row">
              {focusCategories.map((item) => (
                <span key={item.id} className="category-chip">
                  <span className="category-chip__icon" aria-hidden="true">
                    <BoltIcon fontSize="inherit" />
                  </span>
                  {item.label} · %{Math.round(item.accuracy)} başarı
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="categories-section">
        <div className="flex-between">
          <h2 className="section-heading">Kategorileri keşfedin</h2>
          <span className="text-secondary text-sm">
            {categories.length} kategori · {quizList.length} quiz
          </span>
        </div>
        {listLoading ? (
          <div className="category-grid">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={`skeleton-${idx}`}
                className="surface-card card-content skeleton skeleton--card"
              />
            ))}
          </div>
        ) : (
          <>
            <div className="category-grid">
              {categories.map((cat) => {
                const prog = categoryProgress[cat.id]?.accuracy || 0;
                const quizCount = quizCategoryIndex.counts[cat.id] || 0;
                const CategoryIcon =
                  categoryIconMap[cat.icon] || LibraryBooksIcon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id)}
                    className="category-card surface-card card-content"
                  >
                    <div className="category-card__top">
                      <span
                        className="category-card__icon"
                        style={{
                          background: `${cat.color}18`,
                          color: cat.color,
                        }}
                        aria-hidden="true"
                      >
                        <CategoryIcon fontSize="inherit" />
                      </span>
                      <div className="category-card__body">
                        <div
                          className="flex-between"
                          style={{ alignItems: "flex-start" }}
                        >
                          <h3 className="category-card__title">{cat.nameTr}</h3>
                          <span className="category-card__meta">
                            <span>
                              <span
                                className="category-chip__icon"
                                aria-hidden="true"
                              >
                                <CalculateIcon fontSize="inherit" />
                              </span>
                              {quizCount} quiz
                            </span>
                          </span>
                        </div>
                        <p className="category-card__description">
                          {cat.descriptionTr}
                        </p>
                        <div className="category-card__meta">
                          <span>
                            <span
                              className="category-chip__icon"
                              aria-hidden="true"
                            >
                              <TargetIcon fontSize="inherit" />
                            </span>
                            %{Math.round(prog)} başarı
                          </span>
                          <span>
                            <span
                              className="category-chip__icon"
                              aria-hidden="true"
                            >
                              <ProgressIcon fontSize="inherit" />
                            </span>
                            {categoryProgress[cat.id]?.attempts || 0} deneme
                          </span>
                          {recommendation === cat.id && (
                            <span className="category-card__badge">
                              Önerilen
                            </span>
                          )}
                        </div>
                        <div className="category-card__progress">
                          <div className="h-2 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-500"
                              style={{
                                width: `${Math.min(100, Math.round(prog))}%`,
                              }}
                            />
                          </div>
                          <div className="category-card__progress-value">
                            %{Math.round(prog)} tamamlandı
                          </div>
                        </div>
                      </div>
                    </div>
                    <span className="category-card__arrow" aria-hidden="true">
                      ›
                    </span>
                  </button>
                );
              })}
            </div>
            {!categories.length && (
              <div className="category-empty-state">
                Kategoriler yüklenirken bir sorun oluştu. Lütfen daha sonra
                tekrar deneyin.
              </div>
            )}
          </>
        )}
      </section>

      <section className="categories-section">
        <h2 className="section-heading">Zorluk seviyeleri</h2>
        <div className="level-grid">
          {levels.map((lvl) => {
            const LevelIcon = levelIconMap[lvl.id] || TargetIcon;
            return (
              <div key={lvl.id} className="surface-card level-card">
                <span
                  className="level-card__icon"
                  style={{ background: `${lvl.color}18`, color: lvl.color }}
                >
                  <LevelIcon fontSize="inherit" />
                </span>
                <strong>{lvl.id}</strong>
                <p className="text-secondary" style={{ fontSize: "0.85rem" }}>
                  {lvl.nameTr}
                </p>
                <p className="text-secondary" style={{ fontSize: "0.75rem" }}>
                  {lvl.descriptionTr}
                </p>
              </div>
            );
          })}
        </div>
      </section>
      <section className="surface-card card-content categories-cta">
        <div>
          <h3 className="font-semibold">Hazırsanız başlayalım</h3>
          <p className="text-secondary mt-2">
            Türkçe anlatımlı quizlerimizle hedefiniz ne olursa olsun adım adım
            ilerleyebilirsiniz. Önerilen kategoriyi seçin veya listeden yeni bir
            konu belirleyin.
          </p>
        </div>
        <div className="categories-cta__actions">
          <button
            className="primary-button"
            onClick={() =>
              handleCategoryClick(recommendedCategory?.id || "grammar")
            }
          >
            Önerilen quize başla
          </button>
          <button className="secondary-button" onClick={() => navigate("/")}>
            Ana sayfaya dön
          </button>
        </div>
      </section>
    </div>
  );
};

export default Categories;
