import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { MenuBookIcon, TimeIcon, SchoolIcon, FireIcon } from "../icons";

const normalizeLevel = (value) =>
  value?.toString().trim().toLowerCase() || null;

const VocabularyQuizShelf = ({ quizzes = [], loading, error }) => {
  const navigate = useNavigate();
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [expandedQuizId, setExpandedQuizId] = useState(null);

  const levelOptions = useMemo(() => {
    const uniques = new Map();

    quizzes.forEach((quiz) => {
      if (!quiz?.level) return;
      const normalized = normalizeLevel(quiz.level);
      if (!normalized || uniques.has(normalized)) return;
      uniques.set(normalized, quiz.level);
    });

    return Array.from(uniques.entries())
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "tr"));
  }, [quizzes]);

  const filteredQuizzes = useMemo(() => {
    if (!selectedLevel) return quizzes;
    return quizzes.filter(
      (quiz) => normalizeLevel(quiz.level) === selectedLevel
    );
  }, [quizzes, selectedLevel]);

  const handleSelectLevel = (levelKey) => {
    setSelectedLevel((prev) => (prev === levelKey ? null : levelKey));
  };

  const showInitialLoading = loading && quizzes.length === 0;
  const showFilteredEmpty =
    !loading && filteredQuizzes.length === 0 && quizzes.length > 0;
  const showGlobalEmpty = !loading && quizzes.length === 0;

  const getQuizKey = (quiz) =>
    (quiz?._id || quiz?.id || quiz?.slug || "").toString();

  const handleStartQuiz = (quiz) => {
    const quizKey = getQuizKey(quiz);
    navigate(`/quiz/${quiz.slug || quizKey}`);
  };

  const handleToggleDetails = (quiz) => {
    const quizKey = getQuizKey(quiz);
    setExpandedQuizId((prev) => (prev === quizKey ? null : quizKey));
  };

  return (
    <section className="surface-card card-content vocabulary-panel vocabulary-panel--quizzes">
      <header className="vocabulary-panel__header">
        <div className="vocabulary-panel__intro">
          <span className="chip chip--accent">Quiz rafı</span>
          <h2 className="vocabulary-panel__title">Kelime quizleri</h2>
          <p className="vocabulary-panel__subtitle">
            Vocabulary kategorisine hazır quizlerle pekiştirin.
          </p>
        </div>
      </header>

      {error && (
        <div className="alert alert--error">
          {error.message || "Quizler yüklenemedi"}
        </div>
      )}

      {levelOptions.length > 1 && (
        <div className="vocabulary-panel__filters" aria-live="polite">
          <span className="vocabulary-panel__filters-label">Seviye seç</span>
          <div className="vocabulary-panel__filters-chips">
            <button
              type="button"
              className={`vocabulary-filter-chip${
                selectedLevel === null ? " is-active" : ""
              }`}
              onClick={() => setSelectedLevel(null)}
            >
              Tümü
            </button>
            {levelOptions.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className={`vocabulary-filter-chip${
                  selectedLevel === key ? " is-active" : ""
                }`}
                onClick={() => handleSelectLevel(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {showInitialLoading && (
        <div className="vocabulary-panel__placeholder">
          Quizler yükleniyor...
        </div>
      )}

      {showGlobalEmpty && (
        <div className="vocabulary-panel__placeholder">
          Henüz kelime odaklı bir quiz yok. Yakında eklenecek!
        </div>
      )}

      {showFilteredEmpty && (
        <div className="vocabulary-panel__placeholder">
          Bu seviyede henüz quiz bulunmuyor. Farklı bir filtre dene.
        </div>
      )}

      {loading && quizzes.length > 0 && (
        <div className="vocabulary-panel__notice" role="status">
          Liste güncelleniyor...
        </div>
      )}

      {filteredQuizzes.length > 0 && (
        <div className="category-grid">
          {filteredQuizzes.map((quiz) => {
            const quizKey = getQuizKey(quiz);
            const isExpanded = expandedQuizId === quizKey;
            const questionCount =
              quiz.questionCount ?? quiz.questions?.length ?? 0;

            return (
              <article
                key={quizKey}
                className="category-card surface-card card-content vocabulary-panel__card"
              >
                <div className="category-card__top">
                  <span
                    className="category-card__icon"
                    aria-hidden="true"
                    style={{ background: "#e0f2fe", color: "#0284c7" }}
                  >
                    <MenuBookIcon fontSize="inherit" />
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
                          {questionCount} soru
                        </span>
                      </span>
                    </div>
                    {quiz.description && (
                      <p className="category-card__description">
                        {quiz.description}
                      </p>
                    )}
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
                    {quiz.tags?.length > 0 && (
                      <div className="vocabulary-panel__tags">
                        {quiz.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="badge badge--muted">
                            {tag}
                          </span>
                        ))}
                        {quiz.tags.length > 3 && (
                          <span className="badge badge--muted">
                            +{quiz.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div
                  className="categories-cta__actions"
                  style={{ marginTop: "1rem" }}
                >
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => handleStartQuiz(quiz)}
                  >
                    Quiz&apos;e başla
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => handleToggleDetails(quiz)}
                  >
                    {isExpanded ? "Detayı gizle" : "Detayı gör"}
                  </button>
                </div>

                {isExpanded && (
                  <div
                    className="vocabulary-panel__card-extra text-sm text-secondary"
                    style={{ marginTop: "1rem" }}
                  >
                    <p>
                      Bu quiz; kelime bilgini pekiştirmen için hazırlanmıştır.
                      Soruların açıklamalarında kısa ipuçları ve örnek cümleler
                      bulunur. Çözmeye hazır olduğunda başlayabilirsin.
                    </p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

VocabularyQuizShelf.propTypes = {
  quizzes: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      id: PropTypes.string,
      slug: PropTypes.string,
      title: PropTypes.string,
      description: PropTypes.string,
      level: PropTypes.string,
      difficulty: PropTypes.string,
      questionCount: PropTypes.number,
      questions: PropTypes.array,
      tags: PropTypes.arrayOf(PropTypes.string),
    })
  ),
  loading: PropTypes.bool,
  error: PropTypes.instanceOf(Error),
};

export default VocabularyQuizShelf;
