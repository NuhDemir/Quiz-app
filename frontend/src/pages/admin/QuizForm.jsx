import React, { useEffect, useMemo, useState } from "react";
import categories from "../../data/categories.json";
import levels from "../../data/levels.json";
import QuestionEditor from "./QuestionEditor";

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Kolay" },
  { value: "medium", label: "Orta" },
  { value: "hard", label: "Zor" },
];

const defaultQuiz = {
  title: "",
  slug: "",
  description: "",
  category: "",
  level: "",
  difficulty: "",
  timeLimitSec: 600,
  tags: [],
  isPublished: false,
  questions: [
    {
      text: "",
      explanation: "",
      options: ["", "", "", ""],
      correctAnswer: "",
      tags: [],
      level: "",
      difficulty: "",
    },
  ],
};

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const sanitizeTimeLimit = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return 0;
  return Math.max(30, Math.min(7200, Math.round(num)));
};

const QuizForm = ({
  initialValues = defaultQuiz,
  saving = false,
  detailLoading = false,
  mode = "create",
  onSubmit,
  onCancel,
}) => {
  const mergedInitial = useMemo(
    () => ({ ...defaultQuiz, ...(initialValues || {}) }),
    [initialValues]
  );

  const [formState, setFormState] = useState(mergedInitial);
  const [questions, setQuestions] = useState(mergedInitial.questions);
  const [tagsInput, setTagsInput] = useState(
    mergedInitial.tags?.join(", ") || ""
  );
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(
    Boolean(mergedInitial.slug)
  );
  const [error, setError] = useState(null);

  useEffect(() => {
    setFormState(mergedInitial);
    setQuestions(mergedInitial.questions);
    setTagsInput(mergedInitial.tags?.join(", ") || "");
    setSlugManuallyEdited(Boolean(mergedInitial.slug));
  }, [mergedInitial]);

  const handleChange = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleTitleChange = (value) => {
    handleChange("title", value);
    if (!slugManuallyEdited) {
      handleChange("slug", slugify(value));
    }
  };

  const handleSlugChange = (value) => {
    setSlugManuallyEdited(true);
    handleChange("slug", slugify(value));
  };

  const parseTags = (value) =>
    value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

  const validate = () => {
    if (!formState.title.trim()) {
      return "Başlık zorunludur";
    }
    if (!formState.slug.trim()) {
      return "Slug zorunludur";
    }
    if (!formState.category) {
      return "Kategori seçmelisiniz";
    }
    if (!formState.level) {
      return "Seviye seçmelisiniz";
    }
    if (!formState.difficulty) {
      return "Zorluk seçmelisiniz";
    }
    if (!questions.length) {
      return "En az bir soru eklemelisiniz";
    }
    for (let i = 0; i < questions.length; i += 1) {
      const q = questions[i];
      if (!q.text.trim()) {
        return `Soru ${i + 1} için metin gerekli`;
      }
      const filledOptions = q.options.filter((opt) => opt && opt.trim());
      if (filledOptions.length < 2) {
        return `Soru ${i + 1}, en az iki seçenek içermelidir`;
      }
      if (!q.correctAnswer || !filledOptions.includes(q.correctAnswer)) {
        return `Soru ${i + 1} için doğru cevabı seçin`;
      }
    }
    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      ...formState,
      slug: formState.slug.trim(),
      tags: parseTags(tagsInput),
      timeLimitSec: sanitizeTimeLimit(formState.timeLimitSec),
      questions,
    };

    try {
      await onSubmit(payload);
    } catch (submitError) {
      setError(submitError?.message || "Kaydetme sırasında hata oluştu");
    }
  };

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <section className="surface-card admin-card">
        <div className="admin-card__header">
          <div>
            <h2>{mode === "edit" ? "Quiz düzenle" : "Yeni quiz oluştur"}</h2>
            <p className="text-secondary">
              Quiz detaylarını belirleyin ve yayımlanma durumunu kontrol edin.
            </p>
          </div>
          <div className="admin-card__actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onCancel}
              disabled={saving}
            >
              Vazgeç
            </button>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving
                ? mode === "edit"
                  ? "Güncelleniyor..."
                  : "Kaydediliyor..."
                : mode === "edit"
                ? "Quiz'i güncelle"
                : "Quiz oluştur"}
            </button>
          </div>
        </div>
        <div className="admin-field-grid">
          <label className="admin-field">
            <span>Başlık</span>
            <input
              type="text"
              value={formState.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="B1 Grammar sınavı"
              disabled={saving}
            />
          </label>
          <label className="admin-field">
            <span>Slug</span>
            <input
              type="text"
              value={formState.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="b1-grammar-sinavi"
              disabled={saving}
            />
          </label>
        </div>
        <label className="admin-field">
          <span>Açıklama</span>
          <textarea
            rows={3}
            value={formState.description || ""}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Quiz hakkında kısa bir açıklama"
            disabled={saving}
          />
        </label>
        <div className="admin-field-grid">
          <label className="admin-field">
            <span>Kategori</span>
            <select
              value={formState.category}
              onChange={(e) => handleChange("category", e.target.value)}
              disabled={saving}
            >
              <option value="">Kategori seçin</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nameTr || category.name || category.id}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-field">
            <span>Seviye</span>
            <select
              value={formState.level}
              onChange={(e) => handleChange("level", e.target.value)}
              disabled={saving}
            >
              <option value="">Seviye seçin</option>
              {levels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.nameTr || level.name || level.id}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-field">
            <span>Zorluk</span>
            <select
              value={formState.difficulty}
              onChange={(e) => handleChange("difficulty", e.target.value)}
              disabled={saving}
            >
              <option value="">Zorluk seçin</option>
              {DIFFICULTY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-field">
            <span>Süre sınırı (saniye)</span>
            <input
              type="number"
              min="30"
              max="7200"
              value={formState.timeLimitSec}
              onChange={(e) => handleChange("timeLimitSec", e.target.value)}
              disabled={saving}
            />
          </label>
        </div>
        <label className="admin-field">
          <span>Etiketler</span>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="grammar, present simple, tense"
            disabled={saving}
          />
        </label>
        <label className="admin-toggle">
          <input
            type="checkbox"
            checked={Boolean(formState.isPublished)}
            onChange={(e) => handleChange("isPublished", e.target.checked)}
            disabled={saving}
          />
          <span>Yayınla (kullanıcılar için görünür)</span>
        </label>
        {error && <div className="admin-form__error">{error}</div>}
        {detailLoading && (
          <p className="text-secondary">Quiz detayları yükleniyor...</p>
        )}
      </section>
      <QuestionEditor
        questions={questions}
        onChange={setQuestions}
        disabled={saving}
      />
    </form>
  );
};

export default QuizForm;
