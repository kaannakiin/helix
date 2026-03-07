'use client';

import { useStoreContextStore } from '@/core/stores/store-context.store';
import type { StoreContext } from '@org/types/storefront';
import { useRef } from 'react';

export function StoreProvider({
  store,
  children,
}: {
  store: StoreContext | null;
  children: React.ReactNode;
}) {
  const initialized = useRef(false);

  if (!initialized.current) {
    useStoreContextStore.getState().initializeStore(store);
    initialized.current = true;
  }

  return children;
}
