import React from "react";
import PropTypes from "prop-types";

const VocabularyAdminWidgets = ({
  onManageCategories,
  onCreateWord,
  isAdmin,
}) => {
  if (!isAdmin) return null;

  return (
    <aside className="surface-card card-content vocabulary-admin">
      <header className="vocabulary-section__header">
        <div>
          <h2>Yönetim araçları</h2>
          <p className="text-secondary text-sm">
            Kategorileri düzenleyin veya yeni kelimeler ekleyin.
          </p>
        </div>
      </header>
      <div className="vocabulary-admin__actions">
        <button
          type="button"
          className="secondary-button"
          onClick={onManageCategories}
        >
          Kategorileri yönet
        </button>
        <button type="button" className="primary-button" onClick={onCreateWord}>
          Yeni kelime ekle
        </button>
      </div>
    </aside>
  );
};

VocabularyAdminWidgets.propTypes = {
  onManageCategories: PropTypes.func,
  onCreateWord: PropTypes.func,
  isAdmin: PropTypes.bool,
};

export default VocabularyAdminWidgets;
