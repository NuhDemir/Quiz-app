import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./authSlice";
import quizSlice from "./quizSlice";
import quizSessionSlice from "./quizSessionSlice";
import userSlice from "./userSlice";
import leaderboardSlice from "./leaderboardSlice";
import adminQuizSlice from "./adminQuizSlice";

export const store = configureStore({
  reducer: {
    auth: authSlice,
    quiz: quizSlice,
    quizSession: quizSessionSlice,
    user: userSlice,
    leaderboard: leaderboardSlice,
    adminQuizzes: adminQuizSlice,
  },
});

export default store;
