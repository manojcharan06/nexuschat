import { create } from 'zustand';
import { refreshApi, logoutApi } from '../api/auth.api.js';

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  setAuth: (user, accessToken) =>
    set({
      user,
      accessToken,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    }),

  clearAuth: () =>
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    }),

  setError: (error) => set({ error }),

  // Hydrate session on application launch
  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const res = await refreshApi();
      const { user, accessToken } = res.data;
      get().setAuth(user, accessToken);
    } catch (err) {
      get().clearAuth();
    }
  },

  logout: async () => {
    try {
      await logoutApi();
    } catch (err) {
      // Ignore logout errors
    } finally {
      get().clearAuth();
    }
  },
}));
