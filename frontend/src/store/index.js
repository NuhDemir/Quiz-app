import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./authSlice";
import quizSlice from "./quizSlice";
import userSlice from "./userSlice";

export const store = configureStore({
  reducer: {
    auth: authSlice,
    quiz: quizSlice,
    user: userSlice,
  },
});

export default store;
