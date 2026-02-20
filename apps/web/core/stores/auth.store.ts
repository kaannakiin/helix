import type { TokenPayload } from '@org/types/token';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface AuthState {
  user: TokenPayload | null;
  isAuthenticated: boolean;
  initializeUser: (user: TokenPayload | null) => void;
  setUser: (user: TokenPayload) => void;
  clearUser: () => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  immer((set) => ({
    user: null,
    isAuthenticated: false,

    initializeUser: (user) =>
      set((state) => {
        state.user = user;
        state.isAuthenticated = user !== null;
      }),

    setUser: (user) =>
      set((state) => {
        state.user = user;
        state.isAuthenticated = true;
      }),

    clearUser: () =>
      set((state) => {
        state.user = null;
        state.isAuthenticated = false;
      }),

    logout: async () => {
      try {
        const { apiClient } = await import('@/core/lib/api/api-client');
        await apiClient.post('/auth/logout');
      } catch {
      } finally {
        set((state) => {
          state.user = null;
          state.isAuthenticated = false;
        });
        window.location.href = '/auth?tab=login';
      }
    },
  }))
);
