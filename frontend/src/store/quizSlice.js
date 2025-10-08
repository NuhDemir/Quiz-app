import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { quizApi } from "../utils/endpoints";

const createCategoryState = () => ({
  items: [],
  meta: null,
  loading: false,
  error: null,
  loaded: false,
  lastFetched: null,
});

const initialState = {
  currentSession: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: [],
  timeRemaining: 0,
  isActive: false,
  results: null,
  loading: false,
  list: [],
  listLoading: false,
  listError: null,
  listLoaded: false,
  listLastFetched: null,
  listMeta: null,
  detailLoading: false,
  detailError: null,
  submitLoading: false,
  submitError: null,
  categoryLists: {
    grammar: createCategoryState(),
  },
};

const ensureCategoryState = (state, key) => {
  if (!state.categoryLists[key]) {
    state.categoryLists[key] = createCategoryState();
  }
  return state.categoryLists[key];
};

export const fetchQuizList = createAsyncThunk(
  "quiz/list",
  async (_, { rejectWithValue }) => {
    try {
      const data = await quizApi.list();
      return data;
    } catch (error) {
      return rejectWithValue(error.data || { error: error.message });
    }
  }
);

export const fetchGrammarQuizList = createAsyncThunk(
  "quiz/list/grammar",
  async (params, { rejectWithValue }) => {
    try {
      const data = await quizApi.listGrammar(params || {});
      return data;
    } catch (error) {
      return rejectWithValue(error.data || { error: error.message });
    }
  }
);

export const fetchQuizDetail = createAsyncThunk(
  "quiz/detail",
  async (id, { rejectWithValue }) => {
    try {
      const data = await quizApi.detail(id);
      return data;
    } catch (error) {
      return rejectWithValue(error.data || { error: error.message });
    }
  }
);

export const submitQuiz = createAsyncThunk(
  "quiz/submit",
  async ({ token, quizId, answers, durationSec }, { rejectWithValue }) => {
    try {
      const data = await quizApi.submit({
        token,
        quizId,
        answers,
        durationSec,
      });
      return data;
    } catch (error) {
      return rejectWithValue(error.data || { error: error.message });
    }
  }
);

const quizSlice = createSlice({
  name: "quiz",
  initialState,
  reducers: {
    startQuiz: (state, action) => {
      const { questions, category, level } = action.payload;
      state.currentSession = {
        id: Date.now().toString(),
        category,
        level,
        startTime: new Date().toISOString(),
        totalQuestions: questions.length,
      };
      state.questions = questions;
      state.currentQuestionIndex = 0;
      state.answers = [];
      state.timeRemaining = questions.length * 60; // 1 minute per question
      state.isActive = true;
      state.results = null;
    },
    answerQuestion: (state, action) => {
      const { answer, timeTaken } = action.payload;
      state.answers.push({
        questionId: state.questions[state.currentQuestionIndex].id,
        answer,
        timeTaken,
        timestamp: new Date().toISOString(),
      });
    },
    nextQuestion: (state) => {
      if (state.currentQuestionIndex < state.questions.length - 1) {
        state.currentQuestionIndex += 1;
      }
    },
    previousQuestion: (state) => {
      if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex -= 1;
      }
    },
    updateTimer: (state, action) => {
      state.timeRemaining = Math.max(0, state.timeRemaining - action.payload);
    },
    endQuiz: (state) => {
      state.isActive = false;
      state.currentSession.endTime = new Date().toISOString();

      // Calculate results
      let correctAnswers = 0;
      state.answers.forEach((answer, index) => {
        const question = state.questions[index];
        if (question && question.correctAnswer === answer.answer) {
          correctAnswers++;
        }
      });

      state.results = {
        totalQuestions: state.questions.length,
        correctAnswers,
        accuracy: (correctAnswers / state.questions.length) * 100,
        totalTime: state.currentSession.endTime
          ? new Date(state.currentSession.endTime) -
            new Date(state.currentSession.startTime)
          : 0,
      };
    },
    resetQuiz: (state) => {
      state.currentSession = null;
      state.questions = [];
      state.currentQuestionIndex = 0;
      state.answers = [];
      state.timeRemaining = 0;
      state.isActive = false;
      state.results = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    clearErrors: (state) => {
      state.listError = null;
      state.detailError = null;
      state.submitError = null;
      Object.values(state.categoryLists || {}).forEach((cat) => {
        if (cat) cat.error = null;
      });
    },
  },
  extraReducers: (builder) => {
    builder
      // List
      .addCase(fetchQuizList.pending, (state) => {
        state.listLoading = true;
        state.listError = null;
      })
      .addCase(fetchQuizList.fulfilled, (state, action) => {
        state.listLoading = false;
        const payload = action.payload;
        state.list = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
          ? payload.items
          : [];
        state.listMeta = payload?.meta || null;
        state.listLoaded = true;
        state.listLastFetched = Date.now();
      })
      .addCase(fetchQuizList.rejected, (state, action) => {
        state.listLoading = false;
        state.listError = action.payload?.error || action.error?.message;
        state.listMeta = null;
        state.listLoaded = false;
      })
      .addCase(fetchGrammarQuizList.pending, (state) => {
        const grammarState = ensureCategoryState(state, "grammar");
        grammarState.loading = true;
        grammarState.error = null;
      })
      .addCase(fetchGrammarQuizList.fulfilled, (state, action) => {
        const grammarState = ensureCategoryState(state, "grammar");
        grammarState.loading = false;
        const payload = action.payload;
        grammarState.items = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.items)
          ? payload.items
          : [];
        grammarState.meta = payload?.meta || null;
        grammarState.loaded = true;
        grammarState.lastFetched = Date.now();
      })
      .addCase(fetchGrammarQuizList.rejected, (state, action) => {
        const grammarState = ensureCategoryState(state, "grammar");
        grammarState.loading = false;
        grammarState.error = action.payload?.error || action.error?.message;
        grammarState.meta = null;
        grammarState.loaded = false;
      })
      // Detail
      .addCase(fetchQuizDetail.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
      })
      .addCase(fetchQuizDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        // Provide questions to startQuiz manually or store raw detail
        state.currentSession = null; // reset any existing session
        state.questions = (action.payload?.questions || []).map((q) => ({
          id: q._id || q.id,
          text: q.text,
          answers: q.answers || q.options || [],
          correctAnswer: q.correctAnswer, // may be hidden on backend for fairness
        }));
      })
      .addCase(fetchQuizDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload?.error || action.error?.message;
      })
      // Submit
      .addCase(submitQuiz.pending, (state) => {
        state.submitLoading = true;
        state.submitError = null;
      })
      .addCase(submitQuiz.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.results = {
          totalQuestions: action.payload.totalQuestions,
          correctAnswers: action.payload.correctCount,
          incorrectAnswers: action.payload.incorrectCount,
          accuracy: action.payload.score,
        };
      })
      .addCase(submitQuiz.rejected, (state, action) => {
        state.submitLoading = false;
        state.submitError = action.payload?.error || action.error?.message;
      });
  },
});

export const {
  startQuiz,
  answerQuestion,
  nextQuestion,
  previousQuestion,
  updateTimer,
  endQuiz,
  resetQuiz,
  setLoading,
  clearErrors,
} = quizSlice.actions;

export default quizSlice.reducer;
