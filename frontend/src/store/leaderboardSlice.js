import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { achievementsApi } from "../utils/endpoints";

// Thunk to fetch leaderboard data. Accepts optional params: { period, limit, offset }
export const fetchLeaderboard = createAsyncThunk(
  "leaderboard/fetch",
  async (params = {}, { rejectWithValue }) => {
    try {
      const data = await achievementsApi.leaderboard(params);
      // Expecting response shape: { leaderboard: [...], total? }
      return data.leaderboard || data.items || [];
    } catch (error) {
      return rejectWithValue(error.data || { error: error.message });
    }
  }
);

const initialState = {
  items: [],
  loading: false,
  error: null,
  lastUpdated: null,
};

const leaderboardSlice = createSlice({
  name: "leaderboard",
  initialState,
  reducers: {
    clearLeaderboard(state) {
      state.items = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeaderboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.lastUpdated = Date.now();
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || action.error?.message;
      });
  },
});

export const { clearLeaderboard } = leaderboardSlice.actions;
export default leaderboardSlice.reducer;
