'use client';

import { createContext, useContext } from 'react';
import type { StoreApi } from 'zustand';
import { useStore } from 'zustand';
import type {
  ActionRegistry,
  DecisionTreeMode,
  DecisionTreeStoreState,
} from './types';

export const DecisionTreeStoreContext =
  createContext<StoreApi<DecisionTreeStoreState> | null>(null);

export function useTreeStore<T>(selector: (s: DecisionTreeStoreState) => T): T {
  const store = useContext(DecisionTreeStoreContext);
  if (!store)
    throw new Error('useTreeStore must be used within DecisionTreeDrawer');
  return useStore(store, selector);
}

export const DecisionTreeModeContext =
  createContext<DecisionTreeMode>('advanced');

export function useTreeMode(): DecisionTreeMode {
  return useContext(DecisionTreeModeContext);
}

export const ActionRegistryContext = createContext<ActionRegistry | null>(null);

export function useActionRegistry(): ActionRegistry {
  const registry = useContext(ActionRegistryContext);
  if (!registry)
    throw new Error('useActionRegistry must be used within DecisionTreeDrawer');
  return registry;
}

export interface FieldLabelContextValue {
  fieldLabels: Record<string, string>;
  operatorLabels: Record<string, string>;
}

const defaultFieldLabels: FieldLabelContextValue = {
  fieldLabels: {},
  operatorLabels: {},
};

export const FieldLabelContext =
  createContext<FieldLabelContextValue>(defaultFieldLabels);

export function useFieldLabels(): FieldLabelContextValue {
  return useContext(FieldLabelContext);
}
