// High-level frontend API layer mapping Netlify functions to convenient wrappers.
// Each function returns parsed JSON payload or throws an Error with status + data.
// Token is optional for public endpoints. Callers should catch and handle errors.

import { apiRequest } from "./apiClient";

// Auth
export const authApi = {
  register: (data) => apiRequest("auth-register", { method: "POST", data }),
  login: (data) => apiRequest("auth-login", { method: "POST", data }),
  me: (token) => apiRequest("auth-me", { method: "GET", token }),
};

// Profile + progress/attempts
export const profileApi = {
  getProfile: (token) => apiRequest("profile", { method: "GET", token }),
  getProgress: (userId) =>
    apiRequest(`progress?userId=${encodeURIComponent(userId)}`, {
      method: "GET",
    }),
  listAttempts: ({ token, limit = 20, offset = 0 } = {}) =>
    apiRequest(
      `quiz-attempts?limit=${encodeURIComponent(limit)}&offset=${encodeURIComponent(
        offset
      )}`,
      { method: "GET", token }
    ),
};

// Quizzes
export const quizApi = {
  list: () => apiRequest("quiz-list", { method: "GET" }),
  detail: (id) => apiRequest(`quiz-detail?id=${encodeURIComponent(id)}`, { method: "GET" }),
  submit: ({ token, quizId, answers, durationSec }) =>
    apiRequest("quiz-submit", {
      method: "POST",
      token,
      data: { quizId, answers, durationSec },
    }),
  create: ({ token, quiz }) =>
    apiRequest("quiz-create", { method: "POST", token, data: quiz }),
};

// Settings
export const settingsApi = {
  get: (token) => apiRequest("settings-get", { method: "GET", token }),
  update: (token, settings) =>
    apiRequest("settings-update", { method: "POST", token, data: settings }),
};

// SRS / Words
export const wordsApi = {
  addWord: ({ token, term, definition, example, language, tags }) =>
    apiRequest("word-add", {
      method: "POST",
      token,
      data: { term, definition, example, language, tags },
    }),
  review: ({ token, wordId, performance }) =>
    apiRequest("srs-review", {
      method: "POST",
      token,
      data: { wordId, performance },
    }),
};

// Achievements / Leaderboard
export const achievementsApi = {
  evaluate: (token) =>
    apiRequest("achievements-evaluate", { method: "POST", token, data: {} }),
  engine: (token) =>
    apiRequest("achievements-engine", { method: "POST", token, data: {} }),
  leaderboard: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`leaderboard${query ? `?${query}` : ""}`, {
      method: "GET",
    });
  },
};

// Utility helper to compose pagination requests generically
export function buildPager(fetchPageFn, { pageSize = 20 } = {}) {
  let offset = 0;
  const size = pageSize;
  return async function next(params = {}) {
    const data = await fetchPageFn({ ...params, limit: size, offset });
    offset += size;
    return data;
  };
}

// Example usage patterns (keep as comments for developers):
// const attemptsPager = buildPager((p) => profileApi.listAttempts({ token, ...p }));
// const first = await attemptsPager();
// const second = await attemptsPager();

export default {
  authApi,
  profileApi,
  quizApi,
  settingsApi,
  wordsApi,
  achievementsApi,
  buildPager,
};