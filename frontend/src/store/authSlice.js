import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiRequest } from "../utils/apiClient";

const AUTH_STORAGE_KEY = "authState";

const loadStoredAuth = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return { user: null, token: null };
    }

    const parsed = JSON.parse(raw);
    return {
      user: parsed.user || null,
      token: parsed.token || null,
    };
  } catch {
    return { user: null, token: null };
  }
};

const persistAuth = ({ user, token }) => {
  try {
    if (!user || !token) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, token }));
  } catch {
    // Best-effort persistence only.
  }
};

const storedAuth = loadStoredAuth();

const initialState = {
  user: storedAuth.user,
  token: storedAuth.token,
  isAuthenticated: Boolean(storedAuth.user && storedAuth.token),
  loading: false,
  error: null,
};

const buildAuthThunk = (type, endpoint) =>
  createAsyncThunk(`auth/${type}`, async (payload, { rejectWithValue }) => {
    try {
      const response = await apiRequest(endpoint, {
        method: "POST",
        data: payload,
      });
      return response;
    } catch (error) {
      return rejectWithValue({
        message: error.data?.error || error.message,
        status: error.status || 400,
      });
    }
  });

export const registerUser = buildAuthThunk("register", "auth-register");
export const loginUser = buildAuthThunk("login", "auth-login");

export const fetchCurrentUser = createAsyncThunk(
  "auth/me",
  async (_, { getState, rejectWithValue }) => {
    const token = getState().auth.token;

    if (!token) {
      return rejectWithValue({ message: "No token available" });
    }

    try {
      const response = await apiRequest("auth-me", {
        method: "GET",
        token,
      });
      return { user: response.user };
    } catch (error) {
      return rejectWithValue({
        message: error.data?.error || error.message,
        status: error.status || 401,
      });
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      persistAuth({ user: null, token: null });
    },
    clearError: (state) => {
      state.error = null;
    },
    setBackendSession: (state, action) => {
      const { user, token } = action.payload || {};
      if (user && token) {
        state.user = user;
        state.token = token;
        state.isAuthenticated = true;
        persistAuth({ user, token });
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        persistAuth({ user: state.user, token: state.token });
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message ||
          action.error?.message ||
          "Kayıt işlemi başarısız";
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        persistAuth({ user: state.user, token: state.token });
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message ||
          action.error?.message ||
          "Giriş işlemi başarısız";
        state.isAuthenticated = false;
      })
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        persistAuth({ user: state.user, token: state.token });
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        const message = action.payload?.message || action.error?.message;

        if (message === "No token available") {
          state.error = null;
          return;
        }

        state.error = message || "Kullanıcı bilgileri alınamadı";

        if (action.payload?.status === 401) {
          state.token = null;
          state.isAuthenticated = false;
          persistAuth({ user: null, token: null });
        }
      });
  },
});

export const { logout, clearError, setBackendSession } = authSlice.actions;
export default authSlice.reducer;
