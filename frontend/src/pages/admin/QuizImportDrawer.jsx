import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import categories from "../../data/categories.json";
import levels from "../../data/levels.json";
import {
  getQuizImportTemplateString,
  validateQuizImport,
} from "../../utils/quizImportValidator";

const difficultyLabels = {
  easy: "Kolay",
  medium: "Orta",
  hard: "Zor",
};

const levelLabels = levels.reduce((acc, level) => {
  const key = String(level.id || level.value || level.code).toUpperCase();
  acc[key] = level.nameTr || level.name || key;
  return acc;
}, {});

const categoryLabels = categories.reduce((acc, category) => {
  const key = String(category.id || category.value || category.code).toLowerCase();
  acc[key] = category.nameTr || category.name || key;
  return acc;
}, {});

const buildSummary = ({ quiz, questions }) => {
  const resolvedLevel = quiz.level ? levelLabels[quiz.level] || quiz.level : "—";
  const resolvedCategory = quiz.category
    ? categoryLabels[quiz.category] || quiz.category
    : "—";
  return {
    title: quiz.title,
    slug: quiz.slug,
    category: resolvedCategory,
    level: resolvedLevel,
    difficulty: difficultyLabels[quiz.difficulty] || quiz.difficulty,
    questionCount: questions.length,
    tags: quiz.tags || [],
    timeLimitSec: quiz.timeLimitSec,
    isPublished: quiz.isPublished,
    sampleQuestions: questions.slice(0, 3).map((q) => ({
      text: q.text,
      options: q.options,
      correctAnswer: q.correctAnswer,
      tags: q.tags || [],
      difficulty: q.difficulty,
      level: q.level,
    })),
  };
};

const parseJSON = (value) => {
  if (!value) {
    throw new Error("JSON içeriği boş olamaz");
  }
  try {
    return JSON.parse(value);
  } catch (error) {
    const message = error?.message || "JSON çözümleme hatası";
    const customError = new Error(message);
    customError.path = "JSON";
    throw customError;
  }
};

const PLACEHOLDER_TEXT = '{\n  "quiz": { ... },\n  "questions": [ ... ]\n}';

const QuizImportDrawer = ({ importing, result, error, onImport, onClose }) => {
  const [jsonInput, setJsonInput] = useState(() => getQuizImportTemplateString());
  const [validationError, setValidationError] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [summary, setSummary] = useState(null);
  const fileInputRef = useRef(null);

  const resetState = useCallback(() => {
    setParsedData(null);
    setSummary(null);
    setValidationError(null);
  }, []);

  useEffect(() => {
    if (jsonInput.trim().length === 0) {
      resetState();
    }
  }, [jsonInput, resetState]);

  useEffect(() => {
    if (result?.status === "success" && !importing) {
      setValidationError(null);
      setParsedData(null);
      setSummary(null);
    }
  }, [result?.status, importing]);

  const handleValidate = useCallback(() => {
    try {
      const data = parseJSON(jsonInput);
      const sanitized = validateQuizImport(data);
      setParsedData(sanitized);
      setSummary(buildSummary(sanitized));
      setValidationError(null);
      return sanitized;
    } catch (err) {
      setValidationError(err.message);
      setParsedData(null);
      setSummary(null);
      return null;
    }
  }, [jsonInput]);

  const handleImport = async () => {
    const sanitized = parsedData || handleValidate();
    if (!sanitized) {
      return;
    }
    await onImport(sanitized);
  };

  const handleTextareaChange = (event) => {
    setJsonInput(event.target.value);
    setValidationError(null);
    setSummary(null);
    setParsedData(null);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      setJsonInput(text);
      setValidationError(null);
      setSummary(null);
      setParsedData(null);
    };
    reader.onerror = () => {
      setValidationError("Dosya okunurken bir sorun oluştu");
    };
    reader.readAsText(file, "utf-8");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([getQuizImportTemplateString()], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "quiz-import-template.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const infoMessage = useMemo(() => {
    if (validationError) {
      return {
        type: "error",
        message: validationError,
      };
    }
    if (error) {
      return {
        type: "error",
        message: error,
      };
    }
    if (result?.status === "success" && result?.message) {
      return {
        type: "success",
        message: result.message,
      };
    }
    if (summary) {
      return {
        type: "info",
        message: `${summary.questionCount} soru içeren quiz içe aktarılmaya hazır.`,
      };
    }
    return null;
  }, [validationError, error, result, summary]);

  return (
    <div className="admin-form quiz-import">
      <section className="surface-card admin-card">
        <div className="admin-card__header">
          <div>
            <h2>JSON’dan quiz içe aktar</h2>
            <p className="text-secondary">
              JSON dosyasını yükleyin veya veriyi aşağıya yapıştırın. Sisteme uygun
              hale getirilmiş içerik doğrulandıktan sonra içe aktarabilirsiniz.
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
              onClick={handleImport}
              disabled={importing || !jsonInput.trim()}
            >
              {importing ? "İçe aktarılıyor..." : "İçe aktar"}
            </button>
          </div>
        </div>
        <div className="quiz-import__actions">
          <label className="secondary-button quiz-import__upload">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              onChange={handleFileUpload}
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
            onClick={handleValidate}
          >
            JSON’u doğrula
          </button>
        </div>
        <label className="admin-field quiz-import__textarea">
          <span>JSON içeriği</span>
          <textarea
            value={jsonInput}
            onChange={handleTextareaChange}
            rows={20}
            spellCheck={false}
            placeholder={PLACEHOLDER_TEXT}
          />
        </label>
        {infoMessage && (
          <div className={`admin-alert admin-alert--${infoMessage.type}`}>
            {infoMessage.message}
          </div>
        )}
        {summary && (
          <div className="quiz-import__summary">
            <h3>Özet</h3>
            <ul>
              <li>
                <strong>Başlık:</strong> {summary.title}
              </li>
              <li>
                <strong>Slug:</strong> {summary.slug}
              </li>
              <li>
                <strong>Kategori:</strong> {summary.category}
              </li>
              <li>
                <strong>Seviye:</strong> {summary.level}
              </li>
              <li>
                <strong>Zorluk:</strong> {summary.difficulty}
              </li>
              <li>
                <strong>Süre:</strong> {summary.timeLimitSec} sn
              </li>
              <li>
                <strong>Durum:</strong> {summary.isPublished ? "Yayında" : "Taslak"}
              </li>
              <li>
                <strong>Etiketler:</strong> {summary.tags.length ? summary.tags.join(", ") : "—"}
              </li>
              <li>
                <strong>Soru sayısı:</strong> {summary.questionCount}
              </li>
            </ul>
            <div className="quiz-import__questions">
              <h4>Örnek sorular</h4>
              <ol>
                {summary.sampleQuestions.map((question, index) => (
                  <li key={question.text.slice(0, 24) + index}>
                    <p className="quiz-import__question-text">{question.text}</p>
                    <div className="quiz-import__question-meta">
                      <span>
                        <strong>Zorluk:</strong> {question.difficulty ? difficultyLabels[question.difficulty] || question.difficulty : "—"}
                      </span>
                      <span>
                        <strong>Seviye:</strong> {question.level ? levelLabels[question.level] || question.level : "—"}
                      </span>
                      {question.tags?.length ? (
                        <span>
                          <strong>Etiketler:</strong> {question.tags.join(", ")}
                        </span>
                      ) : null}
                    </div>
                    <ul className="quiz-import__options">
                      {question.options.map((option) => (
                        <li
                          key={option}
                          className={
                            option === question.correctAnswer
                              ? "quiz-import__option quiz-import__option--correct"
                              : "quiz-import__option"
                          }
                        >
                          {option}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

QuizImportDrawer.propTypes = {
  importing: PropTypes.bool,
  result: PropTypes.shape({
    status: PropTypes.string,
    message: PropTypes.string,
  }),
  error: PropTypes.string,
  onImport: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

QuizImportDrawer.defaultProps = {
  importing: false,
  result: null,
  error: null,
};

export default QuizImportDrawer;
