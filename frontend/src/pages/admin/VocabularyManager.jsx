import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import levels from "../../data/levels.json";
import { vocabularyApi } from "../../utils/endpoints";
import ImportVocabularyDrawer from "./ImportVocabularyDrawer";

const difficultyOptions = [
  { value: "easy", label: "Kolay" },
  { value: "medium", label: "Orta" },
  { value: "hard", label: "Zor" },
];

const statusOptions = [
  { value: "draft", label: "Taslak" },
  { value: "published", label: "Yayında" },
  { value: "archived", label: "Arşiv" },
];

const defaultCategoryForm = {
  name: "",
  slug: "",
  description: "",
  level: "unknown",
  color: "#2563eb",
};

const defaultWordForm = {
  term: "",
  translation: "",
  definition: "",
  examplesText: "",
  notes: "",
  category: "",
  level: "unknown",
  difficulty: "easy",
  tags: "",
  status: "draft",
};

const slugify = (value) =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeCategory = (category) => ({
  ...category,
  id: category.id || category._id,
  name: category.name || category.nameTr || category.slug,
});

const normalizeWord = (word) => ({
  ...word,
  id: word.id || word._id,
});

const VocabularyManager = () => {
  const token = useSelector((state) => state.auth?.token);
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState(null);

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState(null);
  const [categoryForm, setCategoryForm] = useState(defaultCategoryForm);
  const [categoryStatus, setCategoryStatus] = useState(null);
  const [categorySaving, setCategorySaving] = useState(false);

  const [words, setWords] = useState([]);
  const [wordsLoading, setWordsLoading] = useState(false);
  const [wordsError, setWordsError] = useState(null);
  const [wordForm, setWordForm] = useState(defaultWordForm);
  const [wordStatus, setWordStatus] = useState(null);
  const [wordSaving, setWordSaving] = useState(false);
  const [wordDeletingIds, setWordDeletingIds] = useState([]);
  const [wordUpdatingIds, setWordUpdatingIds] = useState([]);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [categories]);

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const payload = await vocabularyApi.categories({
        token,
        includeInactive: true,
      });
      const normalized = (payload.items || []).map(normalizeCategory);
      setCategories(normalized);
    } catch (error) {
      setCategoriesError(
        error?.message || "Kategoriler yüklenirken bir sorun oluştu"
      );
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchWords = async () => {
    setWordsLoading(true);
    setWordsError(null);
    try {
      const payload = await vocabularyApi.list({
        token,
        limit: 200,
        status: "all",
      });
      const normalized = (payload.items || []).map(normalizeWord);
      setWords(normalized);
    } catch (error) {
      setWordsError(error?.message || "Kelime listesi alınamadı");
    } finally {
      setWordsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchWords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const openImport = () => {
    setShowImport(true);
    setImportResult(null);
    setImportError(null);
  };

  const closeImport = () => {
    setShowImport(false);
  };

  const handleImport = async (payload) => {
    setImporting(true);
    setImportError(null);
    try {
      const res = await vocabularyApi.importJSON({ token, payload });
      setImportResult(res);
      await fetchCategories();
      await fetchWords();
    } catch (err) {
      setImportError(err?.message || "İçe aktarma başarısız");
    } finally {
      setImporting(false);
    }
  };

  const handleCategoryChange = (field, value) => {
    setCategoryForm((prev) => ({
      ...prev,
      [field]: field === "name" ? value : value,
      ...(field === "name" && !prev.slug ? { slug: slugify(value) } : {}),
    }));
  };

  const handleCategorySlugChange = (value) => {
    setCategoryForm((prev) => ({ ...prev, slug: slugify(value) }));
  };

  const resetCategoryForm = () => {
    setCategoryForm(defaultCategoryForm);
  };

  const handleCreateCategory = async (event) => {
    event.preventDefault();
    setCategoryStatus(null);

    if (!categoryForm.name.trim() || !categoryForm.slug.trim()) {
      setCategoryStatus({
        type: "error",
        message: "Kategori adı ve slug alanları zorunludur",
      });
      return;
    }

    setCategorySaving(true);
    try {
      await vocabularyApi.upsertCategory({
        token,
        payload: {
          name: categoryForm.name.trim(),
          slug: categoryForm.slug.trim(),
          description: categoryForm.description.trim() || undefined,
          level: categoryForm.level,
          color: categoryForm.color,
        },
      });
      setCategoryStatus({ type: "success", message: "Kategori oluşturuldu" });
      resetCategoryForm();
      await fetchCategories();
    } catch (error) {
      setCategoryStatus({
        type: "error",
        message: error?.message || "Kategori oluşturulamadı",
      });
    } finally {
      setCategorySaving(false);
    }
  };

  const handleToggleCategory = async (category) => {
    setCategoryStatus(null);
    try {
      await vocabularyApi.upsertCategory({
        token,
        payload: {
          id: category.id,
          isActive: !category.isActive,
        },
      });
      setCategoryStatus({ type: "success", message: "Kategori güncellendi" });
      await fetchCategories();
    } catch (error) {
      setCategoryStatus({
        type: "error",
        message: error?.message || "Kategori güncellenemedi",
      });
    }
  };

  const handleWordChange = (field, value) => {
    setWordForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetWordForm = () => {
    setWordForm(defaultWordForm);
  };

  const parseTags = (value) =>
    value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

  const parseExamples = (value) =>
    value
      .split("\n")
      .map((example) => example.trim())
      .filter(Boolean);

  const handleCreateWord = async (event) => {
    event.preventDefault();
    setWordStatus(null);

    if (!wordForm.term.trim()) {
      setWordStatus({ type: "error", message: "Kelime alanı zorunludur" });
      return;
    }

    setWordSaving(true);
    try {
      await vocabularyApi.create({
        token,
        payload: {
          term: wordForm.term.trim(),
          translation: wordForm.translation.trim() || undefined,
          definition: wordForm.definition.trim() || undefined,
          category: wordForm.category || undefined,
          notes: wordForm.notes.trim() || undefined,
          examples: parseExamples(wordForm.examplesText),
          tags: parseTags(wordForm.tags),
          level: wordForm.level,
          difficulty: wordForm.difficulty,
          status: wordForm.status,
        },
      });
      setWordStatus({ type: "success", message: "Kelime eklendi" });
      resetWordForm();
      await fetchWords();
    } catch (error) {
      setWordStatus({
        type: "error",
        message: error?.message || "Kelime eklenemedi",
      });
    } finally {
      setWordSaving(false);
    }
  };

  const handleDeleteWord = async (wordId) => {
    setWordStatus(null);
    setWordDeletingIds((prev) => [...prev, wordId]);
    try {
      await vocabularyApi.remove({ token, id: wordId });
      setWordStatus({ type: "success", message: "Kelime silindi" });
      await fetchWords();
    } catch (error) {
      setWordStatus({
        type: "error",
        message: error?.message || "Kelime silinemedi",
      });
    } finally {
      setWordDeletingIds((prev) => prev.filter((id) => id !== wordId));
    }
  };

  const handleToggleWordPublish = async (word) => {
    const wordId = word.id;
    const nextStatus = word.status === "published" ? "draft" : "published";
    setWordStatus(null);
    setWordUpdatingIds((prev) => [...prev, wordId]);
    try {
      await vocabularyApi.update({
        token,
        id: wordId,
        payload: { status: nextStatus },
      });
      setWordStatus({ type: "success", message: "Kelime güncellendi" });
      await fetchWords();
    } catch (error) {
      setWordStatus({
        type: "error",
        message: error?.message || "Kelime güncellenemedi",
      });
    } finally {
      setWordUpdatingIds((prev) => prev.filter((id) => id !== wordId));
    }
  };

  return (
    <div className="admin-vocabulary-manager">
      <section className="surface-card admin-card">
        <div className="admin-card__header">
          <div>
            <h2>Kelime kitaplığı</h2>
            <p className="text-secondary">
              Yeni kelimeler ekleyin, mevcut kayıtları yönetin ve yayın durumunu
              kontrol edin.
            </p>
          </div>
        </div>

        {wordStatus && (
          <div className={`admin-alert admin-alert--${wordStatus.type}`}>
            {wordStatus.message}
          </div>
        )}

        {wordsError && (
          <div className="admin-alert admin-alert--error">{wordsError}</div>
        )}

        <form className="admin-form" onSubmit={handleCreateWord}>
          <div className="admin-field-grid">
            <label className="admin-field">
              <span>Kelime</span>
              <input
                type="text"
                value={wordForm.term}
                onChange={(event) =>
                  handleWordChange("term", event.target.value)
                }
                placeholder="ör. sustainability"
                disabled={wordSaving}
              />
            </label>
            <label className="admin-field">
              <span>Çeviri</span>
              <input
                type="text"
                value={wordForm.translation}
                onChange={(event) =>
                  handleWordChange("translation", event.target.value)
                }
                placeholder="ör. sürdürülebilirlik"
                disabled={wordSaving}
              />
            </label>
          </div>

          <label className="admin-field">
            <span>Tanım</span>
            <textarea
              rows={3}
              value={wordForm.definition}
              onChange={(event) =>
                handleWordChange("definition", event.target.value)
              }
              placeholder="Kelimenin anlamı"
              disabled={wordSaving}
            />
          </label>

          <label className="admin-field">
            <span>Örnek cümleler</span>
            <textarea
              rows={3}
              value={wordForm.examplesText}
              onChange={(event) =>
                handleWordChange("examplesText", event.target.value)
              }
              placeholder={`Her satıra bir örnek yazın\nör. Sustainability is crucial for future generations.`}
              disabled={wordSaving}
            />
          </label>

          <label className="admin-field">
            <span>Notlar</span>
            <textarea
              rows={2}
              value={wordForm.notes}
              onChange={(event) =>
                handleWordChange("notes", event.target.value)
              }
              placeholder="Opsiyonel notlar"
              disabled={wordSaving}
            />
          </label>

          <div className="admin-field-grid">
            <label className="admin-field">
              <span>Kategori</span>
              <select
                value={wordForm.category}
                onChange={(event) =>
                  handleWordChange("category", event.target.value)
                }
                disabled={wordSaving}
              >
                <option value="">Kategori seçin</option>
                {sortedCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                    {!category.isActive ? " (pasif)" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field">
              <span>Seviye</span>
              <select
                value={wordForm.level}
                onChange={(event) =>
                  handleWordChange("level", event.target.value)
                }
                disabled={wordSaving}
              >
                <option value="unknown">Bilinmiyor</option>
                {levels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.nameTr || level.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field">
              <span>Zorluk</span>
              <select
                value={wordForm.difficulty}
                onChange={(event) =>
                  handleWordChange("difficulty", event.target.value)
                }
                disabled={wordSaving}
              >
                {difficultyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field">
              <span>Durum</span>
              <select
                value={wordForm.status}
                onChange={(event) =>
                  handleWordChange("status", event.target.value)
                }
                disabled={wordSaving}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="admin-field-grid">
            <label className="admin-field">
              <span>Etiketler</span>
              <input
                type="text"
                value={wordForm.tags}
                onChange={(event) =>
                  handleWordChange("tags", event.target.value)
                }
                placeholder="virgülle ayırarak yazın"
                disabled={wordSaving}
              />
            </label>
          </div>

          <div className="admin-card__actions">
            <button
              type="button"
              className="secondary-button"
              onClick={openImport}
            >
              JSON’dan içe aktar
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={resetWordForm}
              disabled={wordSaving}
            >
              Temizle
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={wordSaving}
            >
              {wordSaving ? "Kaydediliyor..." : "Kelime ekle"}
            </button>
          </div>
        </form>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Kelime</th>
                <th>Çeviri</th>
                <th>Durum</th>
                <th>Seviye</th>
                <th>Zorluk</th>
                <th>Kategori</th>
                <th>Güncellendi</th>
                <th>Aksiyonlar</th>
              </tr>
            </thead>
            <tbody>
              {wordsLoading && (
                <tr>
                  <td colSpan={8} className="admin-table__empty">
                    Kelime listesi yükleniyor...
                  </td>
                </tr>
              )}
              {!wordsLoading && words.length === 0 && (
                <tr>
                  <td colSpan={8} className="admin-table__empty">
                    Henüz kelime eklenmemiş.
                  </td>
                </tr>
              )}
              {!wordsLoading &&
                words.map((word) => {
                  const deleting = wordDeletingIds.includes(word.id);
                  const updating = wordUpdatingIds.includes(word.id);
                  return (
                    <tr key={word.id}>
                      <td>
                        <div className="admin-table__title">
                          <strong>{word.term}</strong>
                          <span>{word.translation || "—"}</span>
                        </div>
                      </td>
                      <td>{word.translation || "—"}</td>
                      <td>
                        <span
                          className={`admin-status admin-status--${
                            word.status === "published"
                              ? "success"
                              : word.status === "archived"
                              ? "muted"
                              : "warning"
                          }`}
                        >
                          {word.status === "published"
                            ? "Yayında"
                            : word.status === "archived"
                            ? "Arşiv"
                            : "Taslak"}
                        </span>
                      </td>
                      <td>{word.level || "unknown"}</td>
                      <td>{word.difficulty || "—"}</td>
                      <td>
                        {word.category?.name || word.category?.slug || "—"}
                      </td>
                      <td>
                        {word.updatedAt
                          ? new Date(word.updatedAt).toLocaleDateString("tr-TR")
                          : "—"}
                      </td>
                      <td className="admin-table__actions">
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => handleToggleWordPublish(word)}
                          disabled={updating}
                        >
                          {word.status === "published"
                            ? updating
                              ? "Güncelleniyor..."
                              : "Taslağa al"
                            : updating
                            ? "Güncelleniyor..."
                            : "Yayınla"}
                        </button>
                        <button
                          type="button"
                          className="secondary-button admin-button--danger"
                          onClick={() => handleDeleteWord(word.id)}
                          disabled={deleting}
                        >
                          {deleting ? "Siliniyor..." : "Sil"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>

      {showImport && (
        <div className="admin-drawer">
          <button
            type="button"
            className="admin-drawer__backdrop"
            onClick={closeImport}
            aria-label="İçe aktarma panelini kapat"
          />
          <div className="admin-drawer__content admin-drawer__content--wide">
            <ImportVocabularyDrawer
              importing={importing}
              result={importResult}
              error={importError}
              onImport={handleImport}
              onClose={closeImport}
            />
          </div>
        </div>
      )}

      <section className="surface-card admin-card">
        <div className="admin-card__header">
          <div>
            <h2>Kategori yönetimi</h2>
            <p className="text-secondary">
              Kelime kategorilerini oluşturun, düzenleyin ve etkinlik durumunu
              yönetin.
            </p>
          </div>
        </div>

        {categoryStatus && (
          <div className={`admin-alert admin-alert--${categoryStatus.type}`}>
            {categoryStatus.message}
          </div>
        )}

        {categoriesError && (
          <div className="admin-alert admin-alert--error">
            {categoriesError}
          </div>
        )}

        <form className="admin-form" onSubmit={handleCreateCategory}>
          <div className="admin-field-grid">
            <label className="admin-field">
              <span>Kategori adı</span>
              <input
                type="text"
                value={categoryForm.name}
                onChange={(event) =>
                  handleCategoryChange("name", event.target.value)
                }
                placeholder="ör. Çevre"
                disabled={categorySaving}
              />
            </label>
            <label className="admin-field">
              <span>Slug</span>
              <input
                type="text"
                value={categoryForm.slug}
                onChange={(event) =>
                  handleCategorySlugChange(event.target.value)
                }
                placeholder="cevre"
                disabled={categorySaving}
              />
            </label>
          </div>

          <label className="admin-field">
            <span>Açıklama</span>
            <textarea
              rows={2}
              value={categoryForm.description}
              onChange={(event) =>
                handleCategoryChange("description", event.target.value)
              }
              placeholder="Kategori açıklaması"
              disabled={categorySaving}
            />
          </label>

          <div className="admin-field-grid">
            <label className="admin-field">
              <span>Seviye</span>
              <select
                value={categoryForm.level}
                onChange={(event) =>
                  handleCategoryChange("level", event.target.value)
                }
                disabled={categorySaving}
              >
                <option value="unknown">Bilinmiyor</option>
                {levels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.nameTr || level.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field">
              <span>Renk</span>
              <input
                type="color"
                value={categoryForm.color}
                onChange={(event) =>
                  handleCategoryChange("color", event.target.value)
                }
                disabled={categorySaving}
              />
            </label>
          </div>

          <div className="admin-card__actions">
            <button
              type="button"
              className="secondary-button"
              onClick={resetCategoryForm}
              disabled={categorySaving}
            >
              Temizle
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={categorySaving}
            >
              {categorySaving ? "Kaydediliyor..." : "Kategori ekle"}
            </button>
          </div>
        </form>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ad</th>
                <th>Slug</th>
                <th>Seviye</th>
                <th>Durum</th>
                <th>Kelime sayısı</th>
                <th>Güncellendi</th>
                <th>Aksiyonlar</th>
              </tr>
            </thead>
            <tbody>
              {categoriesLoading && (
                <tr>
                  <td colSpan={7} className="admin-table__empty">
                    Kategoriler yükleniyor...
                  </td>
                </tr>
              )}
              {!categoriesLoading && categories.length === 0 && (
                <tr>
                  <td colSpan={7} className="admin-table__empty">
                    Henüz kategori oluşturulmamış.
                  </td>
                </tr>
              )}
              {!categoriesLoading &&
                sortedCategories.map((category) => (
                  <tr key={category.id}>
                    <td>{category.name}</td>
                    <td>{category.slug}</td>
                    <td>{category.level || "unknown"}</td>
                    <td>
                      <span
                        className={`admin-status admin-status--${
                          category.isActive ? "success" : "muted"
                        }`}
                      >
                        {category.isActive ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                    <td>{category.wordCount ?? 0}</td>
                    <td>
                      {category.updatedAt
                        ? new Date(category.updatedAt).toLocaleDateString(
                            "tr-TR"
                          )
                        : "—"}
                    </td>
                    <td className="admin-table__actions">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => handleToggleCategory(category)}
                      >
                        {category.isActive ? "Pasifleştir" : "Aktifleştir"}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default VocabularyManager;
