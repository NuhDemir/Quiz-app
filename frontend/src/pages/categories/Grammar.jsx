import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchGrammarQuizList } from "../../store/quizSlice";
import { fetchProgress } from "../../store/userSlice";
import levels from "../../data/levels.json";
import {
  LibraryBooksIcon,
  TargetIcon,
  TimeIcon,
  VerifiedIcon,
  SchoolIcon,
  FireIcon,
  TranslateIcon,
  BoltIcon,
} from "../../components/icons";

const LEVEL_OPTIONS = [{ id: "", nameTr: "Tümü" }, ...levels];
const DIFFICULTY_OPTIONS = [
  { id: "", label: "Tümü" },
  { id: "easy", label: "Kolay" },
  { id: "medium", label: "Orta" },
  { id: "hard", label: "Zor" },
];

const defaultCategoryState = Object.freeze({
  items: [],
  meta: null,
  loading: false,
  error: null,
  loaded: false,
  lastFetched: null,
});

const Grammar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const categoryLists = useSelector((state) => state.quiz.categoryLists);
  const {
    items: grammarQuizzes,
    loading: grammarLoading,
    error: grammarError,
  } = categoryLists?.grammar || defaultCategoryState;
  const { progress, stats } = useSelector((state) => state.user);
  const { user } = useSelector((state) => state.auth);
  const [activeQuizId, setActiveQuizId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    level: "",
    difficulty: "",
  });

  useEffect(() => {
    const payload = {
      search: appliedFilters.search ? appliedFilters.search.trim() : undefined,
      level: appliedFilters.level || undefined,
      difficulty: appliedFilters.difficulty || undefined,
    };

    dispatch(fetchGrammarQuizList(payload));
  }, [
    dispatch,
    appliedFilters.search,
    appliedFilters.level,
    appliedFilters.difficulty,
  ]);

  useEffect(() => {
    if (user && !progress) {
      dispatch(fetchProgress({ userId: user._id || user.id }));
    }
  }, [dispatch, user, progress]);

  const grammarStats = useMemo(() => {
    const serverStats = progress?.categoryStats?.grammar;
    if (serverStats) {
      return {
        accuracy: serverStats.accuracy ?? 0,
        attempts: serverStats.attempts ?? 0,
        correct: serverStats.correct ?? 0,
      };
    }
    const localStats = stats.categoryStats?.grammar;
    return {
      accuracy: localStats?.accuracy || 0,
      attempts: localStats?.totalQuestions || 0,
      correct: localStats?.correctAnswers || 0,
    };
  }, [progress, stats]);

  const featuredQuiz = grammarQuizzes[0] || null;

  const getQuizKey = (quiz) =>
    (quiz?._id || quiz?.id || quiz?.slug || "").toString();

  const handlePreview = (quiz) => {
    const key = getQuizKey(quiz);
    setActiveQuizId((prev) => (prev === key ? null : key));
  };

  const handleApplyFilters = () => {
    setAppliedFilters({
      search: searchTerm.trim(),
      level: levelFilter,
      difficulty: difficultyFilter,
    });
    setActiveQuizId(null);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setLevelFilter("");
    setDifficultyFilter("");
    setAppliedFilters({ search: "", level: "", difficulty: "" });
    setActiveQuizId(null);
  };

  const handleStartQuiz = (quiz) => {
    if (!quiz) return;
    const quizKey = getQuizKey(quiz);
    if (!quizKey) return;
    navigate(`/quiz/${quiz.slug || quizKey}`);
  };

  return (
    <div className="layout-wrapper categories-page">
      <section className="surface-card card-content categories-header">
        <div className="categories-header__top">
          <div className="categories-header__info">
            <span className="chip chip--accent">Gramer Çalışmaları</span>
            <h1 className="categories-header__title">
              Gramer kategorisinde uzmanlaşın
            </h1>
            <p className="categories-header__subtitle">
              Temel cümle yapılarından, karmaşık zaman yapılarına kadar tüm
              konuları Türkçe açıklamalarla pekiştirin.
            </p>
            <div className="category-chip-row">
              <span className="category-chip">
                <span className="category-chip__icon" aria-hidden="true">
                  <LibraryBooksIcon fontSize="inherit" />
                </span>
                {grammarQuizzes.length} hazır quiz
              </span>
              <span className="category-chip">
                <span className="category-chip__icon" aria-hidden="true">
                  <TargetIcon fontSize="inherit" />
                </span>
                Ortalama başarı %{Math.round(grammarStats.accuracy || 0)}
              </span>
              <span className="category-chip">
                <span className="category-chip__icon" aria-hidden="true">
                  <TimeIcon fontSize="inherit" />
                </span>
                {grammarStats.attempts || 0} deneme
              </span>
            </div>
          </div>
          {featuredQuiz && (
            <div className="categories-header__highlight">
              <span className="categories-header__badge">
                <span aria-hidden="true">
                  <BoltIcon fontSize="inherit" />
                </span>
                Öne çıkan quiz
              </span>
              <div className="categories-header__highlight-title">
                {featuredQuiz.title || "Gramer Quiz"}
              </div>
              <p className="categories-header__highlight-description">
                {featuredQuiz.description ||
                  "Bu quiz, temel cümle yapıları üzerine yoğunlaşarak kısa sürede gramer becerilerinizi tazelemenize yardımcı olur."}
              </p>
              <button
                className="primary-button"
                onClick={() => handleStartQuiz(featuredQuiz)}
              >
                Quiz&apos;e başla
              </button>
              <button
                className="secondary-button"
                onClick={() => handlePreview(featuredQuiz)}
              >
                {activeQuizId === getQuizKey(featuredQuiz)
                  ? "Özeti gizle"
                  : "Quiz detayını gör"}
              </button>
            </div>
          )}
        </div>
        {grammarLoading && (
          <div className="text-sm text-secondary">Quizler yükleniyor...</div>
        )}
        {grammarError && (
          <div className="text-sm text-red-500">
            Quizler alınırken hata: {grammarError}
          </div>
        )}
      </section>

      <section className="categories-section surface-card card-content">
        <form
          className="grid gap-4 md:grid-cols-4"
          onSubmit={(event) => {
            event.preventDefault();
            handleApplyFilters();
          }}
        >
          <div className="md:col-span-2">
            <label className="form-label" htmlFor="grammar-search">
              Quiz ara
            </label>
            <input
              id="grammar-search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Başlık veya açıklamada ara"
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label" htmlFor="grammar-level">
              Seviye
            </label>
            <select
              id="grammar-level"
              value={levelFilter}
              onChange={(event) => setLevelFilter(event.target.value)}
              className="form-input"
            >
              {LEVEL_OPTIONS.map((option) => (
                <option key={option.id || "all-levels"} value={option.id}>
                  {option.nameTr || option.id || "Tümü"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label" htmlFor="grammar-difficulty">
              Zorluk
            </label>
            <select
              id="grammar-difficulty"
              value={difficultyFilter}
              onChange={(event) => setDifficultyFilter(event.target.value)}
              className="form-input"
            >
              {DIFFICULTY_OPTIONS.map((option) => (
                <option key={option.id || "all-difficulty"} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleResetFilters}
              className="secondary-button"
            >
              Temizle
            </button>
            <button type="submit" className="primary-button">
              Filtrele
            </button>
          </div>
        </form>
      </section>

      {featuredQuiz && activeQuizId === getQuizKey(featuredQuiz) && (
        <section className="surface-card card-content categories-section">
          <h2 className="section-heading">Quiz hakkında</h2>
          <p className="text-secondary">
            Quiz soruları konuları kısa ders niteliğinde tekrar ederek Türkçe
            açıklamalı ipuçları içerir.
          </p>
          <ul className="categories-header__list" style={{ marginTop: "1rem" }}>
            <li>
              Çoğu soru çoktan seçmeli olup, seçenekler günlük kullanım
              örnekleriyle desteklenir.
            </li>
            <li>
              Her sorudan sonra doğru cevap açıklaması verilir; yanlış
              yaptığınız konular yeniden test edilir.
            </li>
            <li>
              Quiz sonunda genel özet ile hangi gramer konusunu tekrar etmeniz
              gerektiği belirtilir.
            </li>
          </ul>
        </section>
      )}

      <section className="categories-section">
        <div className="flex-between">
          <h2 className="section-heading">Gramer quiz listesi</h2>
          <span className="text-secondary text-sm">
            {grammarQuizzes.length} quiz bulundu
          </span>
        </div>
        {grammarQuizzes.length === 0 && !grammarLoading ? (
          <div className="category-empty-state">
            Bu kategori için yayınlanmış quiz bulunmuyor. Lütfen daha sonra
            tekrar kontrol edin.
          </div>
        ) : (
          <div className="category-grid">
            {grammarQuizzes.map((quiz) => {
              const quizKey = getQuizKey(quiz);
              const isActive = activeQuizId === quizKey;
              return (
                <div
                  key={quizKey}
                  className="category-card surface-card card-content"
                >
                  <div className="category-card__top">
                    <span
                      className="category-card__icon"
                      aria-hidden="true"
                      style={{ background: "#e0f2fe", color: "#0284c7" }}
                    >
                      <TranslateIcon fontSize="inherit" />
                    </span>
                    <div className="category-card__body">
                      <div
                        className="flex-between"
                        style={{ alignItems: "flex-start" }}
                      >
                        <h3 className="category-card__title">{quiz.title}</h3>
                        <span className="category-card__meta">
                          <span>
                            <span
                              className="category-chip__icon"
                              aria-hidden="true"
                            >
                              <TimeIcon fontSize="inherit" />
                            </span>
                            {quiz.questionCount ||
                              (quiz.questions?.length ?? 0)}{" "}
                            soru
                          </span>
                        </span>
                      </div>
                      <p className="category-card__description">
                        {quiz.description ||
                          "Gramer becerilerinizi ölçmek için hazırlanmış quiz."}
                      </p>
                      <div className="category-card__meta">
                        {quiz.level && (
                          <span>
                            <span
                              className="category-chip__icon"
                              aria-hidden="true"
                            >
                              <SchoolIcon fontSize="inherit" />
                            </span>
                            Seviye: {quiz.level.toUpperCase?.() || quiz.level}
                          </span>
                        )}
                        {quiz.difficulty && (
                          <span>
                            <span
                              className="category-chip__icon"
                              aria-hidden="true"
                            >
                              <FireIcon fontSize="inherit" />
                            </span>
                            Zorluk: {quiz.difficulty}
                          </span>
                        )}
                      </div>
                      <div className="category-card__progress">
                        <div className="h-2 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round(grammarStats.accuracy || 0)
                              )}%`,
                            }}
                          />
                        </div>
                        <div className="category-card__progress-value">
                          <span
                            className="category-chip__icon"
                            aria-hidden="true"
                          >
                            <VerifiedIcon fontSize="inherit" />
                          </span>{" "}
                          %{Math.round(grammarStats.accuracy || 0)} genel başarı
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    className="categories-cta__actions"
                    style={{ marginTop: "1rem" }}
                  >
                    <button
                      className="primary-button"
                      onClick={() => handleStartQuiz(quiz)}
                    >
                      Quiz&apos;e başla
                    </button>
                    <button
                      className="secondary-button"
                      onClick={() => handlePreview(quiz)}
                    >
                      {isActive ? "Detayı gizle" : "Detayı gör"}
                    </button>
                  </div>
                  {isActive && (
                    <div
                      className="text-sm text-secondary"
                      style={{ marginTop: "1rem" }}
                    >
                      <p>
                        Bu quiz; cümle kurma, doğru zaman seçimi ve anlamı
                        bozmadan çeviri gibi becerileri ölçer. Sorularımız
                        Türkçe açıklamalarla desteklenir, böylece yanlış
                        yaptığınız noktayı kolayca anlarsınız.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Grammar;
