import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchQuizSession,
  submitQuizSession,
  answerQuestion,
  flagQuestion,
  setActiveQuestionIndex,
  incrementTimer,
  toggleReviewMode,
  resetSession,
  selectQuizMeta,
  selectQuestions,
  selectActiveQuestion,
  selectQuizStatus,
  selectFlags,
  selectTimerData,
  selectResults,
  selectReviewMode,
  selectError,
  selectErrorCode,
} from "../store/quizSessionSlice";
import QuizHeader from "../components/quiz/QuizHeader";
import QuizQuestionCard from "../components/quiz/QuizQuestionCard";
import QuizFooter from "../components/quiz/QuizFooter";
import QuizDrawer from "../components/quiz/QuizDrawer";
import QuizResults from "../components/quiz/QuizResults";
import useQuizTimer from "../hooks/useQuizTimer";
import useQuizHotkeys from "../hooks/useQuizHotkeys";

const Quiz = () => {
  const params = useParams();
  const identifier = params.identifier || params.category;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const quiz = useSelector(selectQuizMeta);
  const questions = useSelector(selectQuestions);
  const activeQuestion = useSelector(selectActiveQuestion);
  const status = useSelector(selectQuizStatus);
  const flags = useSelector(selectFlags);
  const timerData = useSelector(selectTimerData);
  const results = useSelector(selectResults);
  const reviewMode = useSelector(selectReviewMode);
  const error = useSelector(selectError);
  const errorCode = useSelector(selectErrorCode);
  const activeQuestionIndex = useSelector(
    (state) => state.quizSession.activeQuestionIndex
  );
  const answers = useSelector((state) => state.quizSession.answers);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [timeUpNotice, setTimeUpNotice] = useState(false);

  const totalQuestions = questions.length;
  const hasQuestions = totalQuestions > 0;
  const answeredCount = useMemo(
    () =>
      Object.values(answers).filter(
        (value) => value !== null && value !== undefined && value !== ""
      ).length,
    [answers]
  );
  const progressPercent = totalQuestions
    ? (answeredCount / totalQuestions) * 100
    : 0;
  const flaggedCount = useMemo(
    () => Object.values(flags || {}).filter(Boolean).length,
    [flags]
  );
  const unansweredCount = Math.max(totalQuestions - answeredCount, 0);

  const isBusy = status === "loading" || status === "submitting";
  const isInitialLoading = !quiz && (status === "idle" || status === "loading");
  const showBusyOverlay = status === "loading" && Boolean(quiz);
  const unauthorized = status === "error" && errorCode === 401;
  const notFound = status === "error" && errorCode === 404;
  const serviceUnavailable =
    status === "error" && [500, 502, 503].includes(Number(errorCode));

  useEffect(() => {
    if (!identifier) {
      return;
    }
    dispatch(fetchQuizSession({ identifier }));
    setDrawerOpen(false);
    setTimeUpNotice(false);
  }, [dispatch, identifier]);

  useEffect(() => {
    if (status !== "inProgress") return undefined;
    const beforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [status]);

  const handleTick = useCallback(() => {
    dispatch(incrementTimer());
  }, [dispatch]);

  const handleTimeout = useCallback(() => {
    if (status !== "inProgress") return;
    setTimeUpNotice(true);
    dispatch(submitQuizSession());
  }, [dispatch, status]);

  useQuizTimer({
    status,
    timeLimitSec: timerData.timeLimitSec,
    elapsedSeconds: timerData.elapsedSeconds,
    onTick: handleTick,
    onTimeout: handleTimeout,
  });

  const handleSelectOption = useCallback(
    (value) => {
      if (!activeQuestion || status !== "inProgress") return;
      dispatch(
        answerQuestion({ questionId: activeQuestion.id, answer: value })
      );
    },
    [activeQuestion, dispatch, status]
  );

  const handleSelectOptionByIndex = useCallback(
    (index) => {
      const option = activeQuestion?.options?.[index];
      if (option) {
        handleSelectOption(option.value);
      }
    },
    [activeQuestion, handleSelectOption]
  );

  const handleToggleFlag = useCallback(() => {
    if (!activeQuestion) return;
    const isFlagged = Boolean(flags?.[activeQuestion.id]);
    dispatch(
      flagQuestion({ questionId: activeQuestion.id, flagged: !isFlagged })
    );
  }, [activeQuestion, dispatch, flags]);

  const handlePrev = useCallback(() => {
    if (activeQuestionIndex <= 0) return;
    dispatch(setActiveQuestionIndex(activeQuestionIndex - 1));
  }, [activeQuestionIndex, dispatch]);

  const handleNext = useCallback(() => {
    if (activeQuestionIndex >= totalQuestions - 1) return;
    dispatch(setActiveQuestionIndex(activeQuestionIndex + 1));
  }, [activeQuestionIndex, dispatch, totalQuestions]);

  const handleFinish = useCallback(() => {
    if (status !== "inProgress") return;
    const confirmFinish =
      unansweredCount > 0
        ? window.confirm(
            `Yanıtlanmamış ${unansweredCount} soru var. Yine de quiz'i bitirmek istiyor musunuz?`
          )
        : window.confirm("Quiz'i bitirmek istediğinize emin misiniz?");
    if (confirmFinish) {
      dispatch(submitQuizSession());
    }
  }, [dispatch, status, unansweredCount]);

  const handleRetry = useCallback(() => {
    if (!identifier) return;
    dispatch(resetSession());
    dispatch(fetchQuizSession({ identifier }));
  }, [dispatch, identifier]);

  const handleExit = useCallback(() => {
    dispatch(resetSession());
    navigate("/categories");
  }, [dispatch, navigate]);

  const handleReviewToggle = useCallback(() => {
    dispatch(toggleReviewMode(!reviewMode));
    if (!reviewMode) {
      setDrawerOpen(false);
    }
  }, [dispatch, reviewMode]);

  useQuizHotkeys({
    enabled: status === "inProgress" && !reviewMode,
    optionsLength: activeQuestion?.options?.length || 0,
    onSelectOption: handleSelectOptionByIndex,
    onNext: handleNext,
    onPrev: handlePrev,
    onToggleFlag: handleToggleFlag,
  });

  if (!identifier) {
    return (
      <div className="quiz-page quiz-page--centered">
        <div className="surface-card card-content text-center">
          <h2>Quiz bulunamadı</h2>
          <p>Geçerli bir quiz bağlantısı kullanarak tekrar deneyin.</p>
          <button
            className="primary-button"
            onClick={() => navigate("/categories")}
          >
            Kategorilere dön
          </button>
        </div>
      </div>
    );
  }

  if (isInitialLoading) {
    return (
      <div className="quiz-page quiz-page--centered">
        <div className="quiz-spinner">
          <div className="quiz-spinner__indicator" />
          <p>Quiz yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="quiz-page quiz-page--centered">
        <div className="surface-card card-content quiz-error">
          <h2>Giriş gerekli</h2>
          <p>
            Bu quiz’i çözebilmek için önce hesabınıza giriş yapmanız gerekiyor.
          </p>
          <div className="quiz-error__actions">
            <button
              type="button"
              className="primary-button"
              onClick={() =>
                navigate("/login", {
                  state: { from: location.pathname },
                })
              }
            >
              Giriş yap
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => navigate("/register")}
            >
              Kayıt ol
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={() => navigate("/categories")}
            >
              Kategorilere dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="quiz-page quiz-page--centered">
        <div className="surface-card card-content quiz-error">
          <h2>
            {serviceUnavailable
              ? "Quiz servisine ulaşılamadı"
              : notFound
              ? "Quiz bulunamadı"
              : "Quiz yüklenemedi"}
          </h2>
          <p>
            {serviceUnavailable
              ? "Sistem şu anda isteğinizi işleyemiyor. Biraz sonra tekrar deneyin veya bağlantı ayarlarınızı kontrol edin."
              : notFound
              ? "Aradığınız quiz yayında olmayabilir veya kaldırılmış olabilir."
              : error || "Quiz bilgileri alınamadı. Daha sonra tekrar deneyin."}
          </p>
          {error && !notFound && !serviceUnavailable && (
            <p className="text-secondary text-sm">Sunucu yanıtı: {error}</p>
          )}
          {serviceUnavailable && error && (
            <p className="text-secondary text-sm">Sunucu yanıtı: {error}</p>
          )}
          <div className="quiz-error__actions">
            {!notFound && (
              <button
                type="button"
                className="primary-button"
                onClick={() => dispatch(fetchQuizSession({ identifier }))}
              >
                Tekrar dene
              </button>
            )}
            <button
              type="button"
              className={notFound ? "primary-button" : "secondary-button"}
              onClick={() => navigate("/categories")}
            >
              Kategorilere dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  const showQuestionView =
    (status === "inProgress" || reviewMode) && Boolean(activeQuestion);
  const footerAction = reviewMode
    ? handleReviewToggle
    : status === "inProgress"
    ? handleFinish
    : undefined;
  const footerLabel = reviewMode ? "İncelemeyi kapat" : "Quiz'i Bitir";

  return (
    <div className="quiz-page">
      {showBusyOverlay && (
        <div className="quiz-page__overlay" aria-hidden="true">
          <div className="quiz-spinner">
            <div className="quiz-spinner__indicator" />
            <p>Quiz güncelleniyor...</p>
          </div>
        </div>
      )}
      <QuizHeader
        quiz={quiz}
        timeLimitSec={timerData.timeLimitSec}
        elapsedSeconds={timerData.elapsedSeconds}
        answeredCount={answeredCount}
        totalQuestions={totalQuestions}
        flaggedCount={flaggedCount}
        onToggleDrawer={() => setDrawerOpen((prev) => !prev)}
        isDrawerOpen={drawerOpen}
      />

      {timeUpNotice && (
        <div className="quiz-alert">
          Süreniz doldu. Cevaplarınız gönderildi.
        </div>
      )}

      {status === "completed" && (
        <QuizResults
          quiz={quiz}
          results={results}
          onReview={handleReviewToggle}
          onRetry={handleRetry}
          onExit={handleExit}
          reviewMode={reviewMode}
        />
      )}

      {showQuestionView && hasQuestions && (
        <QuizQuestionCard
          question={activeQuestion}
          index={activeQuestionIndex}
          total={totalQuestions}
          selectedAnswer={answers[activeQuestion?.id]}
          reviewMode={reviewMode}
          flagged={Boolean(flags?.[activeQuestion?.id])}
          onSelect={handleSelectOption}
          onToggleFlag={handleToggleFlag}
          disabled={status !== "inProgress"}
        />
      )}

      {!hasQuestions && status === "inProgress" && (
        <div className="surface-card card-content quiz-empty">
          <h2>Bu quiz için soru bulunamadı</h2>
          <p>
            Kısa süre içinde sorular eklenene kadar farklı bir quiz deneyin.
          </p>
          <div className="quiz-empty__actions">
            <button
              type="button"
              className="primary-button"
              onClick={() => navigate("/categories")}
            >
              Quiz listesine dön
            </button>
          </div>
        </div>
      )}

      {hasQuestions && (
        <QuizFooter
          currentIndex={activeQuestionIndex}
          total={totalQuestions}
          progressPercent={progressPercent}
          unansweredCount={unansweredCount}
          flaggedCount={flaggedCount}
          onPrev={handlePrev}
          onNext={handleNext}
          onFinish={footerAction}
          canPrev={activeQuestionIndex > 0}
          canNext={activeQuestionIndex < totalQuestions - 1}
          disabled={isBusy || (!activeQuestion && status === "inProgress")}
          submitting={status === "submitting"}
          finishLabel={footerLabel}
        />
      )}

      {hasQuestions && (
        <QuizDrawer
          open={drawerOpen}
          questions={questions}
          answers={answers}
          flags={flags}
          activeIndex={activeQuestionIndex}
          onSelect={(index) => {
            setDrawerOpen(false);
            dispatch(setActiveQuestionIndex(index));
          }}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </div>
  );
};

export default Quiz;
