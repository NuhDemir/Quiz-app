import React from "react";
import PropTypes from "prop-types";

const VocabularyList = ({
  items = [],
  loading,
  error,
  onLoadMore,
  hasMore,
}) => {
  return (
    <div className="surface-card card-content vocabulary-section">
      <header className="vocabulary-section__header">
        <div>
          <h2>Yeni kelimeler</h2>
          <p className="text-secondary text-sm">
            Yayınlanmış kelime kartlarını inceleyin ve koleksiyonunuza ekleyin.
          </p>
        </div>
        {onLoadMore && (
          <button
            type="button"
            className="secondary-button"
            disabled={loading || !hasMore}
            onClick={onLoadMore}
          >
            Daha fazla yükle
          </button>
        )}
      </header>
      {error && (
        <div className="alert alert--error">
          {error.message || "Bir hata oluştu"}
        </div>
      )}
      <div className="vocabulary-grid">
        {loading && items.length === 0 && (
          <div className="vocabulary-grid__placeholder">
            Kelimeler yükleniyor...
          </div>
        )}
        {!loading && items.length === 0 && (
          <div className="vocabulary-grid__placeholder">
            Bu kriterlere uygun kelime bulunamadı.
          </div>
        )}
        {items.map((item) => (
          <article
            key={item.id}
            className="vocabulary-card surface-card--muted"
          >
            <header className="vocabulary-card__header">
              <span className="vocabulary-card__term">{item.term}</span>
              {item.translation && (
                <span className="vocabulary-card__translation">
                  {item.translation}
                </span>
              )}
            </header>
            {item.definition && (
              <p className="vocabulary-card__definition">{item.definition}</p>
            )}
            {item.examples?.length > 0 && (
              <ul className="vocabulary-card__examples">
                {item.examples.slice(0, 2).map((example, idx) => (
                  <li key={idx}>{example}</li>
                ))}
              </ul>
            )}
            <footer className="vocabulary-card__footer">
              <span className="badge">{item.level || "unknown"}</span>
              {item.category?.name && (
                <span className="badge badge--muted">{item.category.name}</span>
              )}
            </footer>
          </article>
        ))}
      </div>
      {loading && items.length > 0 && (
        <div className="vocabulary-list__loading">Yükleniyor...</div>
      )}
      {onLoadMore && !loading && !hasMore && items.length > 0 && (
        <p className="text-secondary text-sm text-center mt-4">
          Tüm sonuçlar yüklendi
        </p>
      )}
    </div>
  );
};

VocabularyList.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      term: PropTypes.string,
      translation: PropTypes.string,
      definition: PropTypes.string,
      examples: PropTypes.arrayOf(PropTypes.string),
      category: PropTypes.shape({
        name: PropTypes.string,
      }),
      level: PropTypes.string,
    })
  ),
  loading: PropTypes.bool,
  error: PropTypes.instanceOf(Error),
  onLoadMore: PropTypes.func,
  hasMore: PropTypes.bool,
};

export default VocabularyList;
