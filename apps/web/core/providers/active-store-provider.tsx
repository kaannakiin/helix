'use client';

import { StoreSelectModal } from '@/core/components/store-select-modal';
import { useAdminStore } from '@/core/hooks/useAdminStores';
import { useActiveStoreStore } from '@/core/stores/active-store.store';
import type { StoreContext } from '@org/types/store';
import { useEffect } from 'react';

interface Props {
  children: React.ReactNode;
  initialStoreId?: string;
}

export function ActiveStoreProvider({ children, initialStoreId }: Props) {
  const setActiveStore = useActiveStoreStore((s) => s.setActiveStore);
  const activeStore = useActiveStoreStore((s) => s.activeStore);
  const clearActiveStore = useActiveStoreStore((s) => s.clearActiveStore);

  const { data: initialStore, isError } = useAdminStore(initialStoreId);

  useEffect(() => {
    if (initialStore) {
      setActiveStore({
        storeId: initialStore.id,
        businessModel: initialStore.businessModel,
        slug: initialStore.slug,
      });
    }
    if (isError) {
      clearActiveStore();
    }
  }, [initialStore, isError, setActiveStore, clearActiveStore]);

  const isValidating = !!initialStoreId && !activeStore && !isError;
  if (isValidating) return null;

  const showModal = !activeStore;

  if (showModal) {
    return (
      <StoreSelectModal
        onSelect={(store: StoreContext) => setActiveStore(store)}
      />
    );
  }

  return <>{children}</>;
}
