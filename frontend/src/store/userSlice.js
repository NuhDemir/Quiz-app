import { createSlice } from "@reduxjs/toolkit";

const getStoredStats = () => {
  try {
    const stats = localStorage.getItem("userStats");
    return stats
      ? JSON.parse(stats)
      : {
          totalQuestions: 0,
          correctAnswers: 0,
          accuracy: 0,
          streak: 0,
          categoryStats: {},
          badges: [],
          level: "A1",
        };
  } catch {
    return {
      totalQuestions: 0,
      correctAnswers: 0,
      accuracy: 0,
      streak: 0,
      categoryStats: {},
      badges: [],
      level: "A1",
    };
  }
};

const initialState = {
  stats: getStoredStats(),
  achievements: [],
  preferences: {
    language: "tr",
    theme: "light",
    notifications: true,
  },
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    updateStats: (state, action) => {
      const { category, correctAnswers, totalQuestions, accuracy } =
        action.payload;

      // Update overall stats
      state.stats.totalQuestions += totalQuestions;
      state.stats.correctAnswers += correctAnswers;
      state.stats.accuracy =
        (state.stats.correctAnswers / state.stats.totalQuestions) * 100;

      // Update category stats
      if (!state.stats.categoryStats[category]) {
        state.stats.categoryStats[category] = {
          totalQuestions: 0,
          correctAnswers: 0,
          accuracy: 0,
        };
      }

      state.stats.categoryStats[category].totalQuestions += totalQuestions;
      state.stats.categoryStats[category].correctAnswers += correctAnswers;
      state.stats.categoryStats[category].accuracy =
        (state.stats.categoryStats[category].correctAnswers /
          state.stats.categoryStats[category].totalQuestions) *
        100;

      // Update streak
      if (accuracy >= 70) {
        state.stats.streak += 1;
      } else {
        state.stats.streak = 0;
      }

      // Save to localStorage
      localStorage.setItem("userStats", JSON.stringify(state.stats));
    },
    addBadge: (state, action) => {
      const badge = action.payload;
      if (!state.stats.badges.some((b) => b.id === badge.id)) {
        state.stats.badges.push({
          ...badge,
          earnedDate: new Date().toISOString(),
        });
        localStorage.setItem("userStats", JSON.stringify(state.stats));
      }
    },
    updatePreferences: (state, action) => {
      state.preferences = { ...state.preferences, ...action.payload };
      localStorage.setItem(
        "userPreferences",
        JSON.stringify(state.preferences)
      );
    },
    resetStats: (state) => {
      state.stats = {
        totalQuestions: 0,
        correctAnswers: 0,
        accuracy: 0,
        streak: 0,
        categoryStats: {},
        badges: [],
        level: "A1",
      };
      localStorage.removeItem("userStats");
    },
  },
});

export const { updateStats, addBadge, updatePreferences, resetStats } =
  userSlice.actions;
export default userSlice.reducer;
