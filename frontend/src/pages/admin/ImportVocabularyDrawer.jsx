import React, { useCallback, useRef, useState } from "react";
import PropTypes from "prop-types";
import { getVocabularyImportTemplateString } from "../../utils/vocabularyImportTemplate";

const PLACEHOLDER = getVocabularyImportTemplateString();

const sanitizeSlug = (value) =>
  (value || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const buildPayloadFromVocabulary = (data) => {
  const defaults =
    data.defaults && typeof data.defaults === "object" ? data.defaults : {};
  const categories = (
    Array.isArray(data.categories) ? data.categories : []
  ).map((category, index) => {
    const slug =
      sanitizeSlug(
        category?.slug ||
          category?.id ||
          category?.name ||
          `category-${index + 1}`
      ) || `category-${index + 1}`;
    return {
      ...category,
      slug,
    };
  });
  const wordsSource = Array.isArray(data.words)
    ? data.words
    : Array.isArray(data.items)
    ? data.items
    : null;

  if (!wordsSource || !wordsSource.length) {
    throw new Error("'words' alanı bulunamadı. En az bir kelime gereklidir.");
  }

  return {
    defaults,
    categories,
    words: wordsSource.map((word, index) => {
      const categorySlug =
        sanitizeSlug(
          word?.category?.slug ||
            word?.category?.id ||
            word?.category?.name ||
            (typeof word?.category === "string" ? word.category : null) ||
            categories[0]?.slug ||
            `category-${index + 1}`
        ) ||
        categories[0]?.slug ||
        `category-${index + 1}`;

      const normalizedSubcategories = Array.isArray(word?.subcategories)
        ? word.subcategories.map((sub, subIndex) => ({
            ...(typeof sub === "object" ? sub : { slug: sub }),
            slug:
              sanitizeSlug(
                (typeof sub === "object"
                  ? sub.slug || sub.id || sub.name
                  : sub) || `${categorySlug}-sub-${subIndex + 1}`
              ) || `${categorySlug}-sub-${subIndex + 1}`,
          }))
        : [];

      return {
        ...word,
        category: word.category
          ? { ...word.category, slug: categorySlug }
          : { slug: categorySlug },
        subcategories: normalizedSubcategories,
      };
    }),
  };
};

const buildPayloadFromQuiz = (quiz = {}, questions = []) => {
  if (!questions.length) {
    throw new Error("Quiz verisi en az bir soru içermelidir.");
  }

  const categorySlug = sanitizeSlug(quiz.slug || quiz.title || "imported-quiz");
  const defaults = {
    language: "en",
    level: quiz.level || "unknown",
    difficulty: quiz.difficulty || "medium",
    status: quiz.isPublished ? "published" : "draft",
    tags: Array.isArray(quiz.tags) ? quiz.tags : [],
  };

  const categories = [
    {
      name: quiz.title || "Imported Quiz",
      slug: categorySlug || "imported-quiz",
      description: quiz.description || undefined,
      level: quiz.level || "unknown",
      isActive: true,
    },
  ];

  const words = questions.map((question, index) => {
    const term =
      question.text ||
      question.prompt ||
      question.title ||
      `Question ${index + 1}`;
    const options = Array.isArray(question.options)
      ? question.options
      : Array.isArray(question.answers)
      ? question.answers
      : [];
    const tags = Array.isArray(question.tags) ? question.tags : [];
    const examples = [];
    if (question.hint) examples.push(question.hint);
    if (question.explanation) examples.push(question.explanation);

    return {
      term,
      translation: question.correctAnswer || options[0] || undefined,
      definition: question.explanation || undefined,
      notes: question.hint || undefined,
      examples,
      tags,
      level: question.level || quiz.level || "unknown",
      difficulty: question.difficulty || quiz.difficulty || "medium",
      status: quiz.isPublished ? "published" : "draft",
      category: { slug: categorySlug || "imported-quiz" },
      decks: {},
      spacedRepetition: {},
    };
  });

  return {
    defaults,
    categories,
    words,
  };
};

const ImportVocabularyDrawer = ({
  importing,
  result,
  error,
  onImport,
  onClose,
}) => {
  const [jsonInput, setJsonInput] = useState(PLACEHOLDER);
  const [validationError, setValidationError] = useState(null);
  const [parsed, setParsed] = useState(null);
  const fileRef = useRef(null);

  const parseJSON = (value) => {
    if (!value) throw new Error("JSON içeriği boş olamaz");
    try {
      return JSON.parse(value);
    } catch (err) {
      const e = new Error(err?.message || "Geçersiz JSON");
      e.path = "JSON";
      throw e;
    }
  };

  const handleValidate = useCallback(() => {
    try {
      const data = parseJSON(jsonInput);
      let payload;

      if (
        Array.isArray(data.words) ||
        Array.isArray(data.items) ||
        data.defaults
      ) {
        payload = buildPayloadFromVocabulary(data);
      } else if (data.quiz && Array.isArray(data.questions)) {
        payload = buildPayloadFromQuiz(data.quiz, data.questions);
      } else {
        throw new Error(
          "JSON formatı desteklenmiyor. 'words' dizisi bulunan vocabulary formatını veya 'quiz' + 'questions' yapısını sağlayın."
        );
      }

      setParsed(payload);
      setValidationError(null);
      return payload;
    } catch (err) {
      setValidationError(err.message);
      setParsed(null);
      return null;
    }
  }, [jsonInput]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setJsonInput(String(reader.result || ""));
    reader.onerror = () => setValidationError("Dosya okuma hatası");
    reader.readAsText(file, "utf-8");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async () => {
    const validated = parsed || handleValidate();
    if (!validated) return;

    await onImport(validated);
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([getVocabularyImportTemplateString()], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "vocabulary-import-template.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-form quiz-import">
      <section className="surface-card admin-card">
        <div className="admin-card__header">
          <div>
            <h2>Vocabulary JSON’dan içe aktar</h2>
            <p className="text-secondary">
              Kelime JSON şablonunu yükleyin veya yapıştırın.
            </p>
          </div>
          <div className="admin-card__actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={importing}
            >
              Kapat
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={handleSubmit}
              disabled={importing}
            >
              {importing ? "İçe aktarılıyor..." : "İçe aktar"}
            </button>
          </div>
        </div>

        <div className="quiz-import__actions">
          <label className="secondary-button quiz-import__upload">
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              onChange={handleFile}
            />
            JSON dosyası yükle
          </label>
          <button
            type="button"
            className="secondary-button"
            onClick={handleDownloadTemplate}
          >
            Şablonu indir
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setJsonInput(PLACEHOLDER)}
          >
            Örnek JSON’u doldur
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={handleValidate}
          >
            JSON’u doğrula
          </button>
        </div>

        <label className="admin-field quiz-import__textarea">
          <span>JSON içeriği</span>
          <textarea
            value={jsonInput}
            onChange={(e) => {
              setJsonInput(e.target.value);
              setValidationError(null);
              setParsed(null);
            }}
            rows={18}
            spellCheck={false}
          />
        </label>

        {validationError && (
          <div className="admin-alert admin-alert--error">
            {validationError}
          </div>
        )}
        {error && <div className="admin-alert admin-alert--error">{error}</div>}
        {result?.status === "success" && (
          <div className="admin-alert admin-alert--success">
            {result.message}
          </div>
        )}
      </section>
    </div>
  );
};

ImportVocabularyDrawer.propTypes = {
  importing: PropTypes.bool,
  result: PropTypes.object,
  error: PropTypes.string,
  onImport: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

ImportVocabularyDrawer.defaultProps = {
  importing: false,
  result: null,
  error: null,
};

export default ImportVocabularyDrawer;
