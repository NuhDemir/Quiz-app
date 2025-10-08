import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { adminQuizzesApi } from "../utils/endpoints";

const initialState = {
  items: [],
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  },
  filters: {},
  loading: false,
  error: null,
  saving: false,
  deletingIds: [],
  selectedQuiz: null,
  draftQuiz: null,
  detailLoading: false,
  importing: false,
  importResult: null,
  importError: null,
};

const ensureToken = (getState) => {
  const token = getState().auth.token;
  if (!token) {
    const error = new Error("Admin işlemi için oturum açın");
    error.status = 401;
    throw error;
  }
  return token;
};

export const fetchAdminQuizzes = createAsyncThunk(
  "adminQuizzes/fetchAll",
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const token = ensureToken(getState);
      const response = await adminQuizzesApi.list({ token, params });
      return response;
    } catch (error) {
      return rejectWithValue({
        message: error.data?.error || error.message,
        status: error.status || 500,
      });
    }
  }
);

export const createAdminQuiz = createAsyncThunk(
  "adminQuizzes/create",
  async (quiz, { getState, rejectWithValue }) => {
    try {
      const token = ensureToken(getState);
      const response = await adminQuizzesApi.create({ token, quiz });
      return response.quiz;
    } catch (error) {
      return rejectWithValue({
        message: error.data?.error || error.message,
        status: error.status || 500,
      });
    }
  }
);

export const fetchAdminQuizById = createAsyncThunk(
  "adminQuizzes/fetchById",
  async (id, { getState, rejectWithValue }) => {
    try {
      const token = ensureToken(getState);
      const response = await adminQuizzesApi.detail({ token, id });
      return response.quiz;
    } catch (error) {
      return rejectWithValue({
        message: error.data?.error || error.message,
        status: error.status || 500,
      });
    }
  }
);

export const updateAdminQuiz = createAsyncThunk(
  "adminQuizzes/update",
  async ({ id, quiz }, { getState, rejectWithValue }) => {
    try {
      const token = ensureToken(getState);
      const response = await adminQuizzesApi.update({ token, id, quiz });
      return response.quiz;
    } catch (error) {
      return rejectWithValue({
        message: error.data?.error || error.message,
        status: error.status || 500,
      });
    }
  }
);

export const deleteAdminQuiz = createAsyncThunk(
  "adminQuizzes/delete",
  async (id, { getState, rejectWithValue }) => {
    try {
      const token = ensureToken(getState);
      await adminQuizzesApi.remove({ token, id });
      return id;
    } catch (error) {
      return rejectWithValue({
        message: error.data?.error || error.message,
        status: error.status || 500,
        id,
      });
    }
  }
);

export const importAdminQuizJSON = createAsyncThunk(
  "adminQuizzes/importJSON",
  async (payload, { getState, rejectWithValue }) => {
    try {
      const token = ensureToken(getState);
      const response = await adminQuizzesApi.importJSON({ token, payload });
      return response;
    } catch (error) {
      return rejectWithValue({
        message: error.data?.error || error.message,
        status: error.status || 500,
      });
    }
  }
);

const adminQuizSlice = createSlice({
  name: "adminQuizzes",
  initialState,
  reducers: {
    setDraftQuiz: (state, action) => {
      state.draftQuiz = action.payload;
    },
    clearDraftQuiz: (state) => {
      state.draftQuiz = null;
    },
    selectQuiz: (state, action) => {
      state.selectedQuiz = action.payload;
    },
    updateFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
      };
    },
    clearImportState: (state) => {
      state.importResult = null;
      state.importError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminQuizzes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminQuizzes.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
        if (action.payload.filters) {
          state.filters = action.payload.filters;
        }
      })
      .addCase(fetchAdminQuizzes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.error?.message;
      })
      .addCase(createAdminQuiz.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createAdminQuiz.fulfilled, (state, action) => {
        state.saving = false;
        if (action.payload) {
          state.items = [action.payload, ...state.items];
        }
      })
      .addCase(createAdminQuiz.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload?.message || action.error?.message;
      })
      .addCase(fetchAdminQuizById.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminQuizById.fulfilled, (state, action) => {
        state.detailLoading = false;
        const quiz = action.payload;
        if (quiz) {
          state.selectedQuiz = quiz;
          const id = quiz.id || quiz._id;
          if (id) {
            const index = state.items.findIndex(
              (item) => item.id === id || item._id === id
            );
            if (index >= 0) {
              state.items[index] = {
                ...state.items[index],
                ...quiz,
              };
            }
          }
        }
      })
      .addCase(fetchAdminQuizById.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload?.message || action.error?.message;
      })
      .addCase(updateAdminQuiz.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateAdminQuiz.fulfilled, (state, action) => {
        state.saving = false;
        const updated = action.payload;
        if (updated) {
          state.items = state.items.map((item) =>
            item.id === updated.id || item._id === updated.id
              ? { ...item, ...updated }
              : item
          );
          if (
            state.selectedQuiz &&
            (state.selectedQuiz.id === updated.id ||
              state.selectedQuiz._id === updated.id)
          ) {
            state.selectedQuiz = { ...state.selectedQuiz, ...updated };
          }
        }
      })
      .addCase(updateAdminQuiz.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload?.message || action.error?.message;
      })
      .addCase(deleteAdminQuiz.pending, (state, action) => {
        state.deletingIds.push(action.meta.arg);
        state.error = null;
      })
      .addCase(deleteAdminQuiz.fulfilled, (state, action) => {
        const id = action.payload;
        state.deletingIds = state.deletingIds.filter((x) => x !== id);
        state.items = state.items.filter(
          (item) => item.id !== id && item._id !== id
        );
        if (
          state.selectedQuiz &&
          (state.selectedQuiz.id === id || state.selectedQuiz._id === id)
        ) {
          state.selectedQuiz = null;
        }
      })
      .addCase(deleteAdminQuiz.rejected, (state, action) => {
        const id = action.payload?.id;
        if (id) {
          state.deletingIds = state.deletingIds.filter((x) => x !== id);
        }
        state.error = action.payload?.message || action.error?.message;
      })
      .addCase(importAdminQuizJSON.pending, (state) => {
        state.importing = true;
        state.importError = null;
        state.importResult = null;
      })
      .addCase(importAdminQuizJSON.fulfilled, (state, action) => {
        state.importing = false;
        state.importResult = action.payload;
        const importedQuiz = action.payload?.quiz;
        if (importedQuiz) {
          const importedId = importedQuiz.id || importedQuiz._id;
          const existingIndex = state.items.findIndex((item) => {
            const itemId = item.id || item._id;
            return (itemId && importedId && itemId === importedId) || item.slug === importedQuiz.slug;
          });
          if (existingIndex >= 0) {
            state.items[existingIndex] = {
              ...state.items[existingIndex],
              ...importedQuiz,
            };
          } else {
            state.items = [importedQuiz, ...state.items];
          }
        }
      })
      .addCase(importAdminQuizJSON.rejected, (state, action) => {
        state.importing = false;
        state.importError = action.payload?.message || action.error?.message;
      });
  },
});

export const {
  setDraftQuiz,
  clearDraftQuiz,
  selectQuiz,
  updateFilters,
  clearImportState,
} = adminQuizSlice.actions;

export default adminQuizSlice.reducer;
