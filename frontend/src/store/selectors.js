export const selectAuthState = (state) => state.auth || {};

export const selectAuthToken = (state) => selectAuthState(state).token || null;

export const selectAuthUser = (state) => selectAuthState(state).user || null;

export const selectIsAuthenticated = (state) =>
  Boolean(selectAuthState(state).isAuthenticated);
