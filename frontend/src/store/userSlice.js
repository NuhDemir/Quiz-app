import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { profileApi, settingsApi } from "../utils/endpoints";

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
    sound: true,
  },
  settingsLoading: false,
  settingsError: null,
  profileLoading: false,
  profileError: null,
  progress: null,
  profile: null,
  attempts: {
    items: [],
    loading: false,
    error: null,
  },
};

export const fetchProfile = createAsyncThunk(
  "user/profile",
  async (token, { rejectWithValue }) => {
    try {
      const data = await profileApi.getProfile(token);
      return data.profile;
    } catch (error) {
      return rejectWithValue(error.data || { error: error.message });
    }
  }
);

export const fetchProgress = createAsyncThunk(
  "user/progress",
  async ({ userId }, { rejectWithValue }) => {
    try {
      const data = await profileApi.getProgress(userId);
      return data.progress;
    } catch (error) {
      return rejectWithValue(error.data || { error: error.message });
    }
  }
);

export const fetchSettings = createAsyncThunk(
  "user/settings/get",
  async (token, { rejectWithValue }) => {
    try {
      const data = await settingsApi.get(token);
      return data.settings || {};
    } catch (error) {
      return rejectWithValue(error.data || { error: error.message });
    }
  }
);

export const updateSettings = createAsyncThunk(
  "user/settings/update",
  async ({ token, settings }, { rejectWithValue }) => {
    try {
      const data = await settingsApi.update(token, settings);
      return data.settings || settings;
    } catch (error) {
      return rejectWithValue(error.data || { error: error.message });
    }
  }
);

export const fetchAttempts = createAsyncThunk(
  "user/attempts",
  async ({ token, limit = 10 }, { rejectWithValue }) => {
    try {
      const data = await profileApi.listAttempts({ token, limit, offset: 0 });
      return data.attempts || [];
    } catch (error) {
      return rejectWithValue(error.data || { error: error.message });
    }
  }
);

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
  extraReducers: (builder) => {
    builder
      // Profile
      .addCase(fetchProfile.pending, (state) => {
        state.profileLoading = true;
        state.profileError = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        const profile = action.payload;
        state.profile = profile;
        if (profile?.progress) {
          state.progress = profile.progress;
        }
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.profileError = action.payload?.error || action.error?.message;
      })
      // Progress
      .addCase(fetchProgress.fulfilled, (state, action) => {
        state.progress = action.payload;
      })
      // Settings get
      .addCase(fetchSettings.pending, (state) => {
        state.settingsLoading = true;
        state.settingsError = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.settingsLoading = false;
        state.preferences = { ...state.preferences, ...action.payload };
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.settingsLoading = false;
        state.settingsError = action.payload?.error || action.error?.message;
      })
      // Settings update
      .addCase(updateSettings.pending, (state) => {
        state.settingsLoading = true;
        state.settingsError = null;
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.settingsLoading = false;
        state.preferences = { ...state.preferences, ...action.payload };
      })
      .addCase(updateSettings.rejected, (state, action) => {
        state.settingsLoading = false;
        state.settingsError = action.payload?.error || action.error?.message;
      });
    builder
      // Attempts
      .addCase(fetchAttempts.pending, (state) => {
        state.attempts.loading = true;
        state.attempts.error = null;
      })
      .addCase(fetchAttempts.fulfilled, (state, action) => {
        state.attempts.loading = false;
        state.attempts.items = action.payload;
      })
      .addCase(fetchAttempts.rejected, (state, action) => {
        state.attempts.loading = false;
        state.attempts.error = action.payload?.error || action.error?.message;
      });
  },
});

export const { updateStats, addBadge, updatePreferences, resetStats } =
  userSlice.actions;
export default userSlice.reducer;
