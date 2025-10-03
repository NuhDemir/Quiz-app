import React from "react";
import levels from "../../data/levels.json";

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Kolay" },
  { value: "medium", label: "Orta" },
  { value: "hard", label: "Zor" },
];

const createEmptyQuestion = () => ({
  text: "",
  explanation: "",
  options: ["", "", "", ""],
  correctAnswer: "",
  tags: [],
  level: "",
  difficulty: "",
});

const QuestionEditor = ({ questions, onChange, disabled = false }) => {
  const handleQuestionChange = (index, updates) => {
    const next = questions.map((q, idx) =>
      idx === index ? { ...q, ...updates } : q
    );
    onChange(next);
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    const next = questions.map((q, idx) => {
      if (idx !== qIndex) return q;
      const options = q.options.map((opt, id) =>
        id === optIndex ? value : opt
      );
      const updated = { ...q, options };
      if (q.correctAnswer === q.options[optIndex]) {
        updated.correctAnswer = value;
      }
      return updated;
    });
    onChange(next);
  };

  const handleCorrectChange = (qIndex, value) => {
    const next = questions.map((q, idx) =>
      idx === qIndex ? { ...q, correctAnswer: value } : q
    );
    onChange(next);
  };

  const handleTagChange = (index, value) => {
    const tags = value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    handleQuestionChange(index, { tags });
  };

  const addOption = (index) => {
    const next = questions.map((q, idx) =>
      idx === index ? { ...q, options: [...q.options, ""] } : q
    );
    onChange(next);
  };

  const removeOption = (qIndex, optIndex) => {
    const next = questions.map((q, idx) => {
      if (idx !== qIndex) return q;
      if (q.options.length <= 2) return q;
      const removedOption = q.options[optIndex];
      const options = q.options.filter((_, id) => id !== optIndex);
      const updated = { ...q, options };
      if (q.correctAnswer === removedOption) {
        updated.correctAnswer = "";
      }
      return updated;
    });
    onChange(next);
  };

  const addQuestion = () => {
    onChange([...questions, createEmptyQuestion()]);
  };

  const removeQuestion = (index) => {
    if (questions.length <= 1) return;
    const next = questions.filter((_, idx) => idx !== index);
    onChange(next);
  };

  return (
    <section className="surface-card admin-card">
      <div className="admin-card__header">
        <div>
          <h2>Sorular</h2>
          <p className="text-secondary">
            Her soru için en az iki seçenek belirtin ve doğru cevabı
            işaretleyin.
          </p>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={addQuestion}
          disabled={disabled}
        >
          Yeni soru ekle
        </button>
      </div>
      <div className="admin-question-list">
        {questions.map((question, index) => (
          <article key={question.id || index} className="admin-question-item">
            <header className="admin-question-item__header">
              <h3>Soru {index + 1}</h3>
              <div className="admin-question-item__actions">
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => removeQuestion(index)}
                  disabled={disabled || questions.length <= 1}
                  title="Soruyu kaldır"
                >
                  ✕
                </button>
              </div>
            </header>
            <label className="admin-field">
              <span>Soru metni</span>
              <textarea
                rows={3}
                value={question.text}
                onChange={(e) =>
                  handleQuestionChange(index, { text: e.target.value })
                }
                disabled={disabled}
                placeholder="Soru metnini girin"
              />
            </label>
            <div className="admin-field-grid">
              <label className="admin-field">
                <span>Seviye (opsiyonel)</span>
                <select
                  value={question.level || ""}
                  onChange={(e) =>
                    handleQuestionChange(index, { level: e.target.value })
                  }
                  disabled={disabled}
                >
                  <option value="">Genel</option>
                  {levels.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.nameTr || level.name || level.id}
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-field">
                <span>Zorluk (opsiyonel)</span>
                <select
                  value={question.difficulty || ""}
                  onChange={(e) =>
                    handleQuestionChange(index, { difficulty: e.target.value })
                  }
                  disabled={disabled}
                >
                  <option value="">Belirtilmedi</option>
                  {DIFFICULTY_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="admin-field">
              <span>Açıklama (opsiyonel)</span>
              <textarea
                rows={2}
                value={question.explanation || ""}
                onChange={(e) =>
                  handleQuestionChange(index, { explanation: e.target.value })
                }
                disabled={disabled}
                placeholder="Doğru cevabın açıklamasını ekleyin"
              />
            </label>
            <div className="admin-options">
              <header className="admin-options__header">
                <h4>Seçenekler</h4>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => addOption(index)}
                  disabled={disabled}
                >
                  Seçenek ekle
                </button>
              </header>
              <div className="admin-options__list">
                {question.options.map((option, optIndex) => (
                  <div key={optIndex} className="admin-option-row">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) =>
                        handleOptionChange(index, optIndex, e.target.value)
                      }
                      disabled={disabled}
                      placeholder={`Seçenek ${optIndex + 1}`}
                    />
                    <label className="admin-option-row__correct">
                      <input
                        type="radio"
                        name={`correct-${index}`}
                        checked={
                          question.correctAnswer === option && option !== ""
                        }
                        onChange={() => handleCorrectChange(index, option)}
                        disabled={disabled || !option}
                      />
                      <span>Doğru</span>
                    </label>
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => removeOption(index, optIndex)}
                      disabled={disabled || question.options.length <= 2}
                      title="Seçeneği kaldır"
                    >
                      −
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <label className="admin-field">
              <span>Etiketler (virgülle ayırın)</span>
              <input
                type="text"
                value={question.tags?.join(", ") || ""}
                onChange={(e) => handleTagChange(index, e.target.value)}
                disabled={disabled}
                placeholder="örn. present simple, grammar"
              />
            </label>
          </article>
        ))}
      </div>
    </section>
  );
};

export default QuestionEditor;
