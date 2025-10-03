// High-level frontend API layer mapping Netlify functions to convenient wrappers.
// Each function returns parsed JSON payload or throws an Error with status + data.
// Token is optional for public endpoints. Callers should catch and handle errors.

import { apiRequest } from "./apiClient";

// Auth
export const authApi = {
  register: (data) => apiRequest("auth-register", { method: "POST", data }),
  login: (data) => apiRequest("auth-login", { method: "POST", data }),
  me: (token) => apiRequest("auth-me", { method: "GET", token }),
  adminLogin: (data) => apiRequest("admin-login", { method: "POST", data }),
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
      `quiz-attempts?limit=${encodeURIComponent(
        limit
      )}&offset=${encodeURIComponent(offset)}`,
      { method: "GET", token }
    ),
};

// Quizzes
export const quizApi = {
  list: () => apiRequest("quiz-list", { method: "GET" }),
  detail: (id) =>
    apiRequest(`quiz-detail?id=${encodeURIComponent(id)}`, { method: "GET" }),
  submit: ({ token, quizId, answers, durationSec }) =>
    apiRequest("quiz-submit", {
      method: "POST",
      token,
      data: { quizId, answers, durationSec },
    }),
  create: ({ token, quiz }) =>
    apiRequest("quiz-create", { method: "POST", token, data: quiz }),
};

// Admin quizzes
export const adminQuizzesApi = {
  list: ({ token, params = {} } = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = `admin-quiz-list${query ? `?${query}` : ""}`;
    return apiRequest(endpoint, {
      method: "GET",
      token,
    });
  },
  detail: ({ token, id, slug }) => {
    if (!id && !slug) {
      throw new Error("Quiz detayı için id veya slug gerekli");
    }
    const searchParams = new URLSearchParams();
    if (id) searchParams.set("id", id);
    if (!id && slug) searchParams.set("slug", slug);
    const endpoint = `admin-quiz-detail?${searchParams.toString()}`;
    return apiRequest(endpoint, {
      method: "GET",
      token,
    });
  },
  create: ({ token, quiz }) =>
    apiRequest("admin-quiz-create", {
      method: "POST",
      token,
      data: quiz,
    }),
  update: ({ token, id, quiz }) => {
    if (!id) {
      throw new Error("Quiz güncelleme için id gerekli");
    }
    const endpoint = `admin-quiz-update?id=${encodeURIComponent(id)}`;
    return apiRequest(endpoint, {
      method: "PUT",
      token,
      data: quiz,
    });
  },
  remove: ({ token, id }) => {
    if (!id) {
      throw new Error("Quiz silmek için id gerekli");
    }
    const endpoint = `admin-quiz-delete?id=${encodeURIComponent(id)}`;
    return apiRequest(endpoint, {
      method: "DELETE",
      token,
    });
  },
};

// Settings
export const settingsApi = {
  get: (token) => apiRequest("settings-get", { method: "GET", token }),
  update: (token, settings) =>
    apiRequest("settings-update", { method: "POST", token, data: settings }),
};

export const quizSessionApi = {
  detail: ({ token, identifier }) => {
    if (!identifier) {
      throw new Error("Quiz detayı için identifier gerekli");
    }
    const isObjectId = /^[a-f\d]{24}$/i.test(identifier.trim());
    const params = new URLSearchParams();
    if (isObjectId) {
      params.set("id", identifier.trim());
    } else {
      params.set("slug", identifier.trim());
    }
    const endpoint = `quiz-detail?${params.toString()}`;
    return apiRequest(endpoint, {
      method: "GET",
      token,
    });
  },
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
  adminQuizzesApi,
  settingsApi,
  wordsApi,
  achievementsApi,
  quizSessionApi,
  buildPager,
};
