import React, { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { MenuIcon } from "../icons";

export const VocabularyCategoryPanel = ({
  open,
  categories,
  loading,
  selectedCategorySlug,
  onSelectCategory,
  onResetCategory,
  onClose,
}) => {
  const [draftCategorySlug, setDraftCategorySlug] = useState(null);

  useEffect(() => {
    if (!open) {
      setDraftCategorySlug(null);
      return undefined;
    }

    setDraftCategorySlug(selectedCategorySlug ?? null);

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, selectedCategorySlug]);

  const handleSelect = useCallback(
    (slug) => {
      onSelectCategory?.(slug);
      onClose?.();
      setDraftCategorySlug(null);
    },
    [onClose, onSelectCategory]
  );

  const handleReset = useCallback(() => {
    onResetCategory?.();
    onClose?.();
    setDraftCategorySlug(null);
  }, [onClose, onResetCategory]);

  const handlePreviewCategory = useCallback((slug) => {
    setDraftCategorySlug(slug);
  }, []);

  const handleClearPreview = useCallback(() => {
    setDraftCategorySlug(null);
  }, []);

  const activeDraftSlug = draftCategorySlug ?? selectedCategorySlug;

  if (!open) {
    return null;
  }

  return (
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
        onClick={onClose}
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
            <button type="button" className="link-button" onClick={handleReset}>
              Filtreyi sıfırla
            </button>
          )}
        </header>

        <div className="vocabulary-category-sheet__body">
          {loading ? (
            <div
              className="vocabulary-categories-panel__skeleton"
              aria-hidden="true"
            >
              <span />
              <span />
              <span />
            </div>
          ) : categories?.length ? (
            <ul
              className="vocabulary-category-sheet__list"
              role="list"
              onMouseLeave={handleClearPreview}
            >
              {categories.map((category) => {
                const isActive = category.slug === activeDraftSlug;
                return (
                  <li key={category.id || category.slug}>
                    <button
                      type="button"
                      className={`vocabulary-category-sheet__item${
                        isActive ? " is-active" : ""
                      }`}
                      onClick={() => handleSelect(category.slug)}
                      onMouseEnter={() => handlePreviewCategory(category.slug)}
                      onFocus={() => handlePreviewCategory(category.slug)}
                      aria-pressed={category.slug === selectedCategorySlug}
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
                      {category.slug === selectedCategorySlug && (
                        <span className="badge badge--muted">Seçili</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div
              className="vocabulary-category-sheet__empty"
              role="presentation"
            >
              Henüz bir kategori yok. İlk kategoriyi oluşturmak için admin
              panelini kullan.
            </div>
          )}
        </div>

        <div className="vocabulary-category-sheet__footer">
          <button type="button" className="secondary-button" onClick={onClose}>
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

VocabularyCategoryPanel.propTypes = {
  open: PropTypes.bool,
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
  onClose: PropTypes.func,
};

VocabularyCategoryPanel.defaultProps = {
  open: false,
  categories: [],
  loading: false,
  selectedCategorySlug: null,
  onSelectCategory: undefined,
  onResetCategory: undefined,
  onClose: undefined,
};

const VocabularyLayout = ({
  title,
  description,
  tabs = [],
  activeTab,
  onTabChange,
  actions,
  statsTitle,
  stats,
  sidebar,
  overlay,
  onOpenCategories,
  children,
}) => {
  const hasSidebar = Boolean(sidebar);
  const contentClassName = `vocabulary-content${
    hasSidebar ? " vocabulary-content--with-sidebar" : ""
  }`;

  return (
    <div className="vocabulary-page layout-wrapper">
      <header className="surface-card card-content vocabulary-header">
        <div className="vocabulary-header__content">
          <div className="vocabulary-header__intro">
            <span className="chip chip--accent">Kelime çalışması</span>
            <h1 className="vocabulary-header__title">{title}</h1>
            {description && (
              <p className="vocabulary-header__subtitle">{description}</p>
            )}
          </div>
          {(onOpenCategories || actions) && (
            <div className="vocabulary-header__actions">
              {onOpenCategories && (
                <button
                  type="button"
                  className="icon-button vocabulary-header__categories-button"
                  onClick={onOpenCategories}
                  aria-label="Kategorileri aç"
                >
                  <MenuIcon fontSize="inherit" />
                </button>
              )}
              {actions}
            </div>
          )}
        </div>
        {Array.isArray(stats) && stats.length > 0 && (
          <div className="vocabulary-hero-stats" aria-live="polite">
            {statsTitle && (
              <div className="vocabulary-hero-stats__header">
                <span className="chip chip--muted">{statsTitle}</span>
              </div>
            )}
            <div className="vocabulary-hero-stats__grid">
              {stats.map((item) => (
                <article key={item.id} className="vocabulary-hero-stat">
                  <header>
                    <span className="label">{item.label}</span>
                    {item.badge && (
                      <span className="badge badge--muted">{item.badge}</span>
                    )}
                  </header>
                  <strong>{item.value}</strong>
                  {item.hint && <p>{item.hint}</p>}
                </article>
              ))}
            </div>
          </div>
        )}
        {tabs.length > 0 && (
          <nav className="vocabulary-tabs" aria-label="Vocabulary tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`vocabulary-tab ${isActive ? "is-active" : ""}`}
                  onClick={() => onTabChange?.(tab.id)}
                  aria-pressed={isActive}
                >
                  {Icon && (
                    <span className="vocabulary-tab__icon" aria-hidden="true">
                      <Icon fontSize="inherit" />
                    </span>
                  )}
                  <span className="vocabulary-tab__label">{tab.label}</span>
                  {tab.badge != null && (
                    <span className="vocabulary-tab__badge">{tab.badge}</span>
                  )}
                </button>
              );
            })}
          </nav>
        )}
      </header>
      <section className={contentClassName}>
        <div className="vocabulary-content__grid">
          <div className="vocabulary-content__main">{children}</div>
          {hasSidebar && (
            <aside className="vocabulary-content__sidebar">{sidebar}</aside>
          )}
        </div>
      </section>
      {overlay}
    </div>
  );
};

VocabularyLayout.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.elementType,
      badge: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    })
  ),
  activeTab: PropTypes.string,
  onTabChange: PropTypes.func,
  actions: PropTypes.node,
  statsTitle: PropTypes.string,
  stats: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      hint: PropTypes.string,
      badge: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    })
  ),
  sidebar: PropTypes.node,
  overlay: PropTypes.node,
  onOpenCategories: PropTypes.func,
  children: PropTypes.node,
};

export default VocabularyLayout;
