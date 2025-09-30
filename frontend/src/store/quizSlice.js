import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentSession: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: [],
  timeRemaining: 0,
  isActive: false,
  results: null,
  loading: false,
};

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
} = quizSlice.actions;

export default quizSlice.reducer;
