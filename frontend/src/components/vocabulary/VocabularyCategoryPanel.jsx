import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";

const MAX_INLINE_ITEMS = 3;

const VocabularyCategoryPanel = ({
  categories,
  loading,
  selectedCategorySlug,
  onSelectCategory,
  onResetCategory,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  useEffect(() => {
    if (!isModalOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        handleCloseModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCloseModal, isModalOpen]);

  const inlineCategories = useMemo(() => {
    if (!Array.isArray(categories)) return [];
    return categories.slice(0, MAX_INLINE_ITEMS);
  }, [categories]);

  const hasMoreCategories = (categories?.length || 0) > inlineCategories.length;

  const handleSelect = useCallback(
    (slug) => {
      onSelectCategory?.(slug);
      setIsModalOpen(false);
    },
    [onSelectCategory]
  );

  const handleReset = useCallback(() => {
    onResetCategory?.();
    setIsModalOpen(false);
  }, [onResetCategory]);

  if (loading) {
    return (
      <section
        className="surface-card card-content vocabulary-categories-panel"
        aria-live="polite"
      >
        <header className="vocabulary-categories-panel__header">
          <div>
            <h2>Kategoriler</h2>
            <p className="text-secondary text-sm">Kategoriler yükleniyor…</p>
          </div>
        </header>
        <div className="vocabulary-categories-panel__skeleton">
          <span />
          <span />
          <span />
        </div>
      </section>
    );
  }

  if (!categories?.length) {
    return (
      <section
        className="surface-card card-content vocabulary-categories-panel"
        aria-live="polite"
      >
        <header className="vocabulary-categories-panel__header">
          <div>
            <h2>Kategoriler</h2>
            <p className="text-secondary text-sm">
              Henüz bir kategori yok. İlk kategoriyi oluşturmak için admin
              panelini kullan.
            </p>
          </div>
        </header>
      </section>
    );
  }

  return (
    <>
      <section
        className="surface-card card-content vocabulary-categories-panel"
        aria-live="polite"
      >
        <header className="vocabulary-categories-panel__header">
          <div>
            <h2>Kategoriler</h2>
            <p className="text-secondary text-sm">
              Odaklanmak istediğin temayı seç. Quizler ve kartlar buna göre
              filtrelenir.
            </p>
          </div>
          <div className="vocabulary-categories-panel__actions">
            {onResetCategory && (
              <button
                type="button"
                className="link-button"
                onClick={handleReset}
                disabled={!selectedCategorySlug}
              >
                Filtreyi sıfırla
              </button>
            )}
            {hasMoreCategories && (
              <button
                type="button"
                className="secondary-button vocabulary-categories-panel__more"
                onClick={handleOpenModal}
              >
                Daha fazla
              </button>
            )}
          </div>
        </header>

        <ul className="vocabulary-category-inline" role="list">
          {inlineCategories.map((category) => {
            const isActive = category.slug === selectedCategorySlug;
            return (
              <li key={category.id || category.slug}>
                <button
                  type="button"
                  className={`vocabulary-category-inline__button${
                    isActive ? " is-active" : ""
                  }`}
                  onClick={() => handleSelect(category.slug)}
                >
                  <span
                    className="vocabulary-category-list__dot"
                    style={{
                      backgroundColor: category.color || "var(--color-primary)",
                    }}
                    aria-hidden="true"
                  />
                  <div className="vocabulary-category-list__meta">
                    <span className="vocabulary-category-list__name">
                      {category.name}
                    </span>
                    <span className="vocabulary-category-list__count">
                      {(category.wordCount || 0).toLocaleString("tr-TR")} kelime
                    </span>
                  </div>
                  {isActive && (
                    <span className="badge badge--muted">Seçili</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {isModalOpen && (
        <div
          className="vocabulary-category-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Kategori seç"
        >
          <button
            type="button"
            className="vocabulary-category-sheet__scrim"
            aria-label="Kapat"
            onClick={handleCloseModal}
          />
          <div className="vocabulary-category-sheet__panel">
            <header className="vocabulary-category-sheet__header">
              <div>
                <h3>Kategoriler</h3>
                <p className="text-secondary text-sm">
                  Tüm kategorilerden birini seç veya filtreyi sıfırla.
                </p>
              </div>
              {onResetCategory && (
                <button
                  type="button"
                  className="link-button"
                  onClick={handleReset}
                >
                  Filtreyi sıfırla
                </button>
              )}
            </header>

            <ul className="vocabulary-category-sheet__list" role="list">
              {categories.map((category) => {
                const isActive = category.slug === selectedCategorySlug;
                return (
                  <li key={category.id || category.slug}>
                    <button
                      type="button"
                      className={`vocabulary-category-sheet__item${
                        isActive ? " is-active" : ""
                      }`}
                      onClick={() => handleSelect(category.slug)}
                    >
                      <span
                        className="vocabulary-category-list__dot"
                        style={{
                          backgroundColor:
                            category.color || "var(--color-primary)",
                        }}
                        aria-hidden="true"
                      />
                      <div className="vocabulary-category-list__meta">
                        <span className="vocabulary-category-list__name">
                          {category.name}
                        </span>
                        <span className="vocabulary-category-list__count">
                          {(category.wordCount || 0).toLocaleString("tr-TR")}{" "}
                          kelime
                        </span>
                      </div>
                      {isActive && (
                        <span className="badge badge--muted">Seçili</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="vocabulary-category-sheet__footer">
              <button
                type="button"
                className="secondary-button"
                onClick={handleCloseModal}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

VocabularyCategoryPanel.propTypes = {
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      slug: PropTypes.string,
      name: PropTypes.string,
      color: PropTypes.string,
      wordCount: PropTypes.number,
    })
  ),
  loading: PropTypes.bool,
  selectedCategorySlug: PropTypes.string,
  onSelectCategory: PropTypes.func,
  onResetCategory: PropTypes.func,
};

VocabularyCategoryPanel.defaultProps = {
  categories: [],
  loading: false,
  selectedCategorySlug: null,
  onSelectCategory: undefined,
  onResetCategory: undefined,
};

export default VocabularyCategoryPanel;
