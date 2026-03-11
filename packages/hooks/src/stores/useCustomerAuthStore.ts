import type { CustomerTokenPayload } from '@org/types/storefront';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface CustomerAuthState {
  customer: CustomerTokenPayload | null;
  isAuthenticated: boolean;
  initializeCustomer: (customer: CustomerTokenPayload | null) => void;
  setCustomer: (customer: CustomerTokenPayload) => void;
  clearCustomer: () => void;
  logout: (logoutFn?: () => Promise<void>) => Promise<void>;
}

export const useCustomerAuthStore = create<CustomerAuthState>()(
  immer((set) => ({
    customer: null,
    isAuthenticated: false,

    initializeCustomer: (customer) =>
      set((state) => {
        state.customer = customer;
        state.isAuthenticated = customer !== null;
      }),

    setCustomer: (customer) =>
      set((state) => {
        state.customer = customer;
        state.isAuthenticated = true;
      }),

    clearCustomer: () =>
      set((state) => {
        state.customer = null;
        state.isAuthenticated = false;
      }),

    logout: async (logoutFn) => {
      try {
        await logoutFn?.();
      } catch {
        // swallow - clear state regardless
      } finally {
        set((state) => {
          state.customer = null;
          state.isAuthenticated = false;
        });
        window.location.href = '/';
      }
    },
  }))
);
