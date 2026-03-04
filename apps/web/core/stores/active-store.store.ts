import { ACTIVE_STORE_COOKIE } from '@org/constants/auth-constants';
import type { StoreContext } from '@org/types/store';
import Cookies from 'js-cookie';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

function setStoreCookie(storeId: string): void {
  Cookies.set(ACTIVE_STORE_COOKIE, storeId, { path: '/', sameSite: 'lax' });
}

function removeStoreCookie(): void {
  Cookies.remove(ACTIVE_STORE_COOKIE, { path: '/' });
}

export function getStoreCookieValue(): string | undefined {
  return Cookies.get(ACTIVE_STORE_COOKIE);
}

interface ActiveStoreState {
  activeStore: StoreContext | null;
  setActiveStore: (store: StoreContext) => void;
  clearActiveStore: () => void;
}

export const useActiveStoreStore = create<ActiveStoreState>()(
  immer((set) => ({
    activeStore: null,

    setActiveStore: (store) => {
      setStoreCookie(store.storeId);
      set((state) => {
        state.activeStore = store;
      });
    },

    clearActiveStore: () => {
      removeStoreCookie();
      set((state) => {
        state.activeStore = null;
      });
    },
  }))
);
