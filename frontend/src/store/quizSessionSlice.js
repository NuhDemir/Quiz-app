import {
  createSlice,
  createAsyncThunk,
  createSelector,
} from "@reduxjs/toolkit";
import { quizSessionApi, quizApi } from "../utils/endpoints";
import { selectAuthToken } from "./selectors";

const SESSION_STORAGE_KEY = "quizSession";
const PROGRESS_STORAGE_KEY = "quizProgress";

const initialState = {
  status: "idle",
  identifier: null,
  quiz: null,
  questionsById: {},
  questionOrder: [],
  activeQuestionIndex: 0,
  answers: {},
  flags: {},
  elapsedSeconds: 0,
  startedAt: null,
  completedAt: null,
  results: null,
  reviewMode: false,
  error: null,
  errorCode: null,
};

const getSessionStorage = () =>
  typeof window !== "undefined" ? window.sessionStorage : null;

const getLocalStorage = () =>
  typeof window !== "undefined" ? window.localStorage : null;

const loadPersistedState = () => {
  try {
    const storage = getSessionStorage();
    if (!storage) return null;
    const raw = storage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.warn("[quizSession] Persisted state parse failed", error);
    return null;
  }
};

const persistState = (state) => {
  try {
    const storage = getSessionStorage();
    if (!storage) return;
    const snapshot = {
      status: state.status,
      identifier: state.identifier,
      quiz: state.quiz,
      questionsById: state.questionsById,
      questionOrder: state.questionOrder,
      activeQuestionIndex: state.activeQuestionIndex,
      answers: state.answers,
      flags: state.flags,
      elapsedSeconds: state.elapsedSeconds,
      startedAt: state.startedAt,
      completedAt: state.completedAt,
      results: state.results,
      reviewMode: state.reviewMode,
      error: state.error,
      errorCode: state.errorCode,
    };
    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(snapshot));
  } catch (error) {
    console.warn("[quizSession] Persist failed", error);
  }
};

const persistProgress = (payload) => {
  try {
    const storage = getLocalStorage();
    if (!storage) return;
    storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("[quizSession] Progress persist failed", error);
  }
};

const restoreState = loadPersistedState();
const baseState = restoreState
  ? {
      ...initialState,
      ...restoreState,
      questionsById: restoreState.questionsById || initialState.questionsById,
      questionOrder: restoreState.questionOrder || initialState.questionOrder,
      answers: restoreState.answers || initialState.answers,
      flags: restoreState.flags || initialState.flags,
      errorCode: restoreState.errorCode ?? initialState.errorCode,
    }
  : initialState;

const normalizeQuiz = (quiz) => {
  if (!quiz) return { quiz: null, questionsById: {}, questionOrder: [] };
  const questionsById = {};
  const questionOrder = [];

  (quiz.questions || []).forEach((question, index) => {
    const id = question.id || question._id || String(index);
    questionOrder.push(id);
    const rawOptions = question.options || question.answers || [];
    const options = rawOptions.map((option, optionIndex) => {
      if (
        typeof option === "string" ||
        typeof option === "number" ||
        typeof option === "boolean"
      ) {
        return {
          id: `${id}-opt-${optionIndex}`,
          value: option,
          label: String(option),
          hint: null,
        };
      }
      if (option && typeof option === "object") {
        const value =
          option.value ??
          option.id ??
          option.key ??
          option.text ??
          option.label ??
          optionIndex;
        const label =
          option.label ||
          option.text ||
          option.value ||
          `Seçenek ${optionIndex + 1}`;
        return {
          id: String(option.id || `${id}-opt-${optionIndex}`),
          value,
          label: String(label),
          hint: option.hint || option.explanation || null,
        };
      }
      return {
        id: `${id}-opt-${optionIndex}`,
        value: option,
        label: String(option ?? `Seçenek ${optionIndex + 1}`),
        hint: null,
      };
    });

    let correctAnswer = question.correctAnswer;
    if (correctAnswer && typeof correctAnswer === "object") {
      correctAnswer =
        correctAnswer.value ??
        correctAnswer.id ??
        correctAnswer.key ??
        correctAnswer.text ??
        null;
    }

    questionsById[id] = {
      id,
      text: question.text || question.questionText || "",
      explanation: question.explanation || "",
      options,
      correctAnswer,
      tags: question.tags || [],
      level: question.level || quiz.level || "",
      difficulty: question.difficulty || quiz.difficulty || "",
      media: question.media || null,
    };
  });

  const mappedQuiz = {
    id: quiz.id || quiz._id || null,
    slug: quiz.slug || null,
    title: quiz.title || "",
    category: quiz.category || null,
    level: quiz.level || "",
    difficulty: quiz.difficulty || "",
    tags: quiz.tags || [],
    timeLimitSec: quiz.timeLimitSec || quiz.durationSec || 0,
    totalQuestions: questionOrder.length,
  };

  return { quiz: mappedQuiz, questionsById, questionOrder };
};

export const fetchQuizSession = createAsyncThunk(
  "quizSession/fetchQuiz",
  async ({ identifier }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = selectAuthToken(state);
      const response = await quizSessionApi.detail({ token, identifier });
      return response.quiz || response;
    } catch (error) {
      return rejectWithValue({
        error: error.data?.error || error.message,
        status: error.status || error.data?.statusCode,
      });
    }
  }
);

export const submitQuizSession = createAsyncThunk(
  "quizSession/submitQuiz",
  async (_, { getState, rejectWithValue }) => {
    const state = getState();
    const { quizSession } = state;
    const token = selectAuthToken(state);
    const quiz = quizSession.quiz;

    if (!quiz) {
      return rejectWithValue({ error: "Aktif quiz yok" });
    }

    const answersPayload = quizSession.questionOrder.map((questionId) => ({
      questionId,
      answer: quizSession.answers[questionId] ?? null,
    }));

    try {
      const response = await quizApi.submit({
        token,
        quizId: quiz.id,
        answers: answersPayload,
        durationSec: quizSession.elapsedSeconds,
      });
      return response;
    } catch (error) {
      return rejectWithValue({
        error: error.data?.error || error.message,
        status: error.status || error.data?.statusCode,
      });
    }
  }
);

const quizSessionSlice = createSlice({
  name: "quizSession",
  initialState: baseState,
  reducers: {
    startSession: (state, action) => {
      const { quiz } = action.payload;
      const normalized = normalizeQuiz(quiz);
      state.identifier = quiz.id || quiz.slug || null;
      state.quiz = normalized.quiz;
      state.questionsById = normalized.questionsById;
      state.questionOrder = normalized.questionOrder;
      state.activeQuestionIndex = 0;
      state.answers = {};
      state.flags = {};
      state.elapsedSeconds = 0;
      state.startedAt = Date.now();
      state.completedAt = null;
      state.results = null;
      state.reviewMode = false;
      state.status = "inProgress";
      state.error = null;
      state.errorCode = null;
      persistState(state);
      persistProgress({ identifier: state.identifier, answers: state.answers });
    },
    restoreSession: (state, action) => {
      const { snapshot } = action.payload || {};
      if (!snapshot) return;
      Object.assign(state, { ...state, ...snapshot });
      state.status = snapshot.status || "inProgress";
      state.errorCode = snapshot.errorCode ?? null;
    },
    answerQuestion: (state, action) => {
      const { questionId, answer } = action.payload;
      state.answers[questionId] = answer;
      persistState(state);
      persistProgress({ identifier: state.identifier, answers: state.answers });
    },
    flagQuestion: (state, action) => {
      const { questionId, flagged } = action.payload;
      state.flags[questionId] = flagged;
      persistState(state);
    },
    setActiveQuestionIndex: (state, action) => {
      const nextIndex = action.payload;
      if (nextIndex >= 0 && nextIndex < state.questionOrder.length) {
        state.activeQuestionIndex = nextIndex;
        persistState(state);
      }
    },
    incrementTimer: (state) => {
      state.elapsedSeconds += 1;
      persistState(state);
    },
    setStatus: (state, action) => {
      state.status = action.payload;
      persistState(state);
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.errorCode = null;
    },
    resetSession: () => {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(PROGRESS_STORAGE_KEY);
      return { ...initialState };
    },
    toggleReviewMode: (state, action) => {
      state.reviewMode =
        typeof action.payload === "boolean"
          ? action.payload
          : !state.reviewMode;
      persistState(state);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuizSession.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.errorCode = null;
      })
      .addCase(fetchQuizSession.fulfilled, (state, action) => {
        const normalized = normalizeQuiz(action.payload);
        state.identifier =
          action.meta?.arg?.identifier ||
          normalized.quiz.id ||
          normalized.quiz.slug ||
          null;
        state.quiz = normalized.quiz;
        state.questionsById = normalized.questionsById;
        state.questionOrder = normalized.questionOrder;
        state.activeQuestionIndex = 0;
        state.answers = {};
        state.flags = {};
        state.elapsedSeconds = 0;
        state.startedAt = Date.now();
        state.completedAt = null;
        state.results = null;
        state.reviewMode = false;
        state.status = "inProgress";
        state.error = null;
        state.errorCode = null;
        persistState(state);
        persistProgress({
          identifier: state.quiz.id || state.quiz.slug,
          answers: state.answers,
        });
      })
      .addCase(fetchQuizSession.rejected, (state, action) => {
        state.status = "error";
        state.error = action.payload?.error || action.error?.message;
        state.errorCode =
          action.payload?.status ?? action.payload?.statusCode ?? null;
      })
      .addCase(submitQuizSession.pending, (state) => {
        state.status = "submitting";
        state.error = null;
        state.errorCode = null;
      })
      .addCase(submitQuizSession.fulfilled, (state, action) => {
        state.status = "completed";
        state.results = action.payload;
        state.completedAt = Date.now();
        persistState(state);
      })
      .addCase(submitQuizSession.rejected, (state, action) => {
        state.status = "inProgress";
        state.error = action.payload?.error || action.error?.message;
        state.errorCode =
          action.payload?.status ?? action.payload?.statusCode ?? null;
      });
  },
});

export const {
  startSession,
  restoreSession,
  answerQuestion,
  flagQuestion,
  setActiveQuestionIndex,
  incrementTimer,
  setStatus,
  setError,
  resetSession,
  toggleReviewMode,
} = quizSessionSlice.actions;

export default quizSessionSlice.reducer;

// Selectors
const selectRoot = (state) => state.quizSession;

export const selectQuizMeta = createSelector(
  [selectRoot],
  (state) => state.quiz
);
export const selectQuestions = createSelector([selectRoot], (state) =>
  state.questionOrder.map((id) => state.questionsById[id])
);
export const selectActiveQuestion = createSelector([selectRoot], (state) => {
  const questionId = state.questionOrder[state.activeQuestionIndex];
  return questionId ? state.questionsById[questionId] : null;
});
export const selectAnswerForQuestion = (questionId) => (state) =>
  state.quizSession.answers[questionId];
export const selectFlags = createSelector([selectRoot], (state) => state.flags);
export const selectQuizStatus = createSelector(
  [selectRoot],
  (state) => state.status
);
export const selectTimerData = createSelector([selectRoot], (state) => ({
  elapsedSeconds: state.elapsedSeconds,
  timeLimitSec: state.quiz?.timeLimitSec || 0,
}));
export const selectResults = createSelector(
  [selectRoot],
  (state) => state.results
);
export const selectReviewMode = createSelector(
  [selectRoot],
  (state) => state.reviewMode
);
export const selectError = createSelector([selectRoot], (state) => state.error);
export const selectErrorCode = createSelector(
  [selectRoot],
  (state) => state.errorCode
);
