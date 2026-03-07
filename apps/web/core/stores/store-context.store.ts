import type { StoreContext } from '@org/types/storefront';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface StoreContextState {
  store: StoreContext | null;
  initializeStore: (store: StoreContext | null) => void;
}

export const useStoreContextStore = create<StoreContextState>()(
  immer((set) => ({
    store: null,

    initializeStore: (store) =>
      set((state) => {
        state.store = store;
      }),
  }))
);
