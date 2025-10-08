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
  list: (params = {}) => {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value == null || value === "") return;
      if (Array.isArray(value)) {
        if (value.length === 0) return;
        searchParams.set(key, value.join(","));
        return;
      }
      searchParams.set(key, String(value));
    });

    const endpoint = `quiz-list${
      searchParams.toString() ? `?${searchParams.toString()}` : ""
    }`;

    return apiRequest(endpoint, { method: "GET" });
  },
  listGrammar: (params = {}) => {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value == null || value === "") return;
      if (Array.isArray(value)) {
        if (value.length === 0) return;
        searchParams.set(key, value.join(","));
        return;
      }
      searchParams.set(key, String(value));
    });

    const endpoint = `quiz-list-grammar${
      searchParams.toString() ? `?${searchParams.toString()}` : ""
    }`;

    return apiRequest(endpoint, { method: "GET" });
  },
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
  importJSON: ({ token, payload }) =>
    apiRequest("admin-quiz-import", {
      method: "POST",
      token,
      data: payload,
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

export const vocabularyApi = {
  list: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.category) searchParams.set("category", params.category);
    if (params.level) searchParams.set("level", params.level);
    if (params.status) searchParams.set("status", params.status);
    if (params.deck) searchParams.set("deck", params.deck);
    if (params.limit) searchParams.set("limit", params.limit);
    if (params.cursor) searchParams.set("cursor", params.cursor);
    if (params.search) searchParams.set("search", params.search);
    const endpoint = `vocabulary-list${
      searchParams.toString() ? `?${searchParams.toString()}` : ""
    }`;
    return apiRequest(endpoint, { method: "GET", token: params.token });
  },
  detail: ({ id, term, token } = {}) => {
    const searchParams = new URLSearchParams();
    if (id) searchParams.set("id", id);
    if (!id && term) searchParams.set("term", term);
    const endpoint = `vocabulary-detail${
      searchParams.toString() ? `?${searchParams.toString()}` : ""
    }`;
    return apiRequest(endpoint, { method: "GET", token });
  },
  create: ({ token, payload }) =>
    apiRequest("vocabulary-create", {
      method: "POST",
      token,
      data: payload,
    }),
  update: ({ token, id, payload }) =>
    apiRequest("vocabulary-update", {
      method: "PUT",
      token,
      data: { id, ...payload },
    }),
  remove: ({ token, id }) => {
    if (!id) throw new Error("Vocabulary delete requires id");
    const endpoint = `vocabulary-delete?id=${encodeURIComponent(id)}`;
    return apiRequest(endpoint, { method: "DELETE", token });
  },
  categories: ({ token, includeInactive } = {}) => {
    const params = new URLSearchParams();
    if (includeInactive) params.set("includeInactive", "1");
    const endpoint = `vocabulary-categories${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    return apiRequest(endpoint, { method: "GET", token });
  },
  importJSON: ({ token, payload }) =>
    apiRequest("vocabulary-import", { method: "POST", token, data: payload }),
  upsertCategory: ({ token, payload }) => {
    if (payload?.id) {
      return apiRequest("vocabulary-categories", {
        method: "PUT",
        token,
        data: payload,
      });
    }
    return apiRequest("vocabulary-categories", {
      method: "POST",
      token,
      data: payload,
    });
  },
  deleteCategory: ({ token, id }) => {
    if (!id) throw new Error("Category delete requires id");
    const endpoint = `vocabulary-categories?id=${encodeURIComponent(id)}`;
    return apiRequest(endpoint, { method: "DELETE", token });
  },
  reviewQueue: ({ token, mode, limit, category, resetSession }) => {
    const params = new URLSearchParams();
    if (mode) params.set("mode", mode);
    if (limit) params.set("limit", limit);
    if (category) params.set("category", category);
    if (resetSession) params.set("reset", "1");
    const endpoint = `vocabulary-review${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    return apiRequest(endpoint, { method: "GET", token });
  },
  submitReview: ({
    token,
    wordId,
    result,
    progressId,
    durationMs,
    categoryId,
  }) =>
    apiRequest("vocabulary-review", {
      method: "POST",
      token,
      data: { wordId, result, progressId, durationMs, categoryId },
    }),
};

export const vocabularyGamesApi = {
  wordHuntStart: ({ token, category, limit } = {}) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (limit) params.set("limit", limit);
    const query = params.toString();
    const url = `vocabulary-game-wordhunt${query ? `?${query}` : ""}`;
    return apiRequest(url, { method: "GET", token });
  },
  wordHuntSubmit: ({ token, sessionId, wordId, positions }) =>
    apiRequest("vocabulary-game-wordhunt", {
      method: "POST",
      token,
      data: { sessionId, wordId, positions },
    }),
  speedChallengeStart: ({ token, category, limit } = {}) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (limit) params.set("limit", limit);
    const url = `vocabulary-game-speed-challenge${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    return apiRequest(url, { method: "GET", token });
  },
  speedChallengeAnswer: ({ token, sessionId, cardId, answer }) =>
    apiRequest("vocabulary-game-speed-challenge", {
      method: "POST",
      token,
      data: { sessionId, cardId, answer },
    }),
  speedChallengeFinish: ({ token, sessionId, elapsedMs }) =>
    apiRequest("vocabulary-game-speed-challenge", {
      method: "POST",
      token,
      data: { sessionId, finish: true, elapsedMs },
    }),
  flashcardBattleStart: ({ token, category } = {}) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    const url = `vocabulary-game-flashcard-battle${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    return apiRequest(url, { method: "GET", token });
  },
  flashcardBattleAnswer: ({ token, sessionId, roundId, answer }) =>
    apiRequest("vocabulary-game-flashcard-battle", {
      method: "POST",
      token,
      data: { sessionId, roundId, answer },
    }),
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
  vocabularyApi,
  vocabularyGamesApi,
  buildPager,
};
