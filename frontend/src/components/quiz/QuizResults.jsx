import React from "react";
import { CheckCircleIcon, ArrowLeftIcon, RetryIcon } from "../icons";

const formatScoreMessage = (score) => {
  if (score >= 90) return "Harika! Üst düzey bir başarı yakaladınız.";
  if (score >= 70)
    return "Çok iyi! Birkaç küçük tekrar ile mükemmel olabilirsiniz.";
  if (score >= 50)
    return "Fena değil, biraz daha pratikle daha da iyi olabilirsiniz.";
  return "Dert etmeyin, birlikte tekrar edelim!";
};

export default function QuizResults({
  quiz,
  results,
  onReview,
  onRetry,
  onExit,
  reviewMode,
}) {
  const score = results?.score ?? 0;
  const totalQuestions = results?.totalQuestions ?? quiz?.totalQuestions ?? 0;
  const correctCount = results?.correctCount ?? 0;
  const incorrectCount = results?.incorrectCount ?? 0;
  const message = formatScoreMessage(score);

  return (
    <section className="quiz-results surface-card card-content">
      <div className="quiz-results__icon">
        <CheckCircleIcon />
      </div>
      <h1 className="quiz-results__title">Quiz tamamlandı!</h1>
      <p className="quiz-results__subtitle">{message}</p>

      <div className="quiz-results__stats">
        <div className="quiz-results__stat">
          <span className="quiz-results__stat-label">Puan</span>
          <span className="quiz-results__stat-value">{score}</span>
        </div>
        <div className="quiz-results__stat">
          <span className="quiz-results__stat-label">Doğru</span>
          <span className="quiz-results__stat-value quiz-results__stat-value--success">
            {correctCount}
          </span>
        </div>
        <div className="quiz-results__stat">
          <span className="quiz-results__stat-label">Yanlış</span>
          <span className="quiz-results__stat-value quiz-results__stat-value--warning">
            {incorrectCount}
          </span>
        </div>
        <div className="quiz-results__stat">
          <span className="quiz-results__stat-label">Toplam Soru</span>
          <span className="quiz-results__stat-value">{totalQuestions}</span>
        </div>
      </div>

      <div className="quiz-results__actions">
        <button type="button" className="primary-button" onClick={onReview}>
          {reviewMode ? "İncelemeyi kapat" : "Soruları incele"}
        </button>
        <button type="button" className="secondary-button" onClick={onRetry}>
          <RetryIcon /> Tekrar çöz
        </button>
        <button type="button" className="ghost-button" onClick={onExit}>
          <ArrowLeftIcon /> Ana sayfaya dön
        </button>
      </div>

      {results?.details && results.details.length > 0 && (
        <div className="quiz-results__details">
          <h2>Soru detayları</h2>
          <ul>
            {results.details.map((detail, index) => (
              <li key={detail.questionId || index}>
                <strong>Soru {index + 1}:</strong> {detail.questionText}
                <div>
                  <span className="quiz-results__detail-label">Cevabınız:</span>{" "}
                  <span
                    className={
                      detail.isCorrect
                        ? "quiz-results__detail-correct"
                        : "quiz-results__detail-incorrect"
                    }
                  >
                    {detail.userAnswer ?? "—"}
                  </span>
                </div>
                {!detail.isCorrect && (
                  <div>
                    <span className="quiz-results__detail-label">
                      Doğru cevap:
                    </span>{" "}
                    <span>{detail.correctAnswer}</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
