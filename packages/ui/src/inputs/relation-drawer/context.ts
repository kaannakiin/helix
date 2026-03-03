'use client';

import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';
import type {
  FetchOptions,
  LookupItem,
  RelationDrawerGridDisplayProps,
  TreeFetchOptions,
} from './types';

export interface RelationDrawerContextValue {
  queryKey: readonly unknown[];
  fetchOptions: FetchOptions | TreeFetchOptions;
  multiple: boolean;
  tree: boolean;
  maxItems?: number;

  opened: boolean;
  open: () => void;
  close: () => void;

  search: string;
  setSearch: (v: string) => void;
  debouncedSearch: string;

  tempSelectedIds: Set<string>;
  toggleItem: (item: LookupItem) => void;
  clearAll: () => void;

  selectedIds: string[];
  resolvedItems: LookupItem[];
  resolving: boolean;

  handleConfirm: () => void;
  handleRemove: (id: string) => void;

  renderItem?: (item: LookupItem) => ReactNode;
  renderSelected?: (item: LookupItem) => ReactNode;
  emptyMessage?: string;

  display: 'pill' | 'grid';
  gridDisplayProps?: RelationDrawerGridDisplayProps;
}

export const RelationDrawerContext =
  createContext<RelationDrawerContextValue | null>(null);

export function useRelationDrawer(): RelationDrawerContextValue {
  const ctx = useContext(RelationDrawerContext);
  if (!ctx) {
    throw new Error(
      'useRelationDrawer must be used within <RelationDrawer.Root>'
    );
  }
  return ctx;
}
