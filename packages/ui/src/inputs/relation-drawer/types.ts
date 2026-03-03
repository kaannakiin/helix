import type { PaginatedResponse } from '@org/types/pagination';
import type { ReactNode } from 'react';
import type { LookupItem } from '../relation-input/types';

export type { LookupItem };

// --- Grid display props ---

export interface RelationDrawerGridDisplayProps {
  renderItem?: (item: LookupItem) => ReactNode;
  rowHeight?: number;
  height?: number;
  removeTooltip?: string;
}

export interface TreeNode extends LookupItem {
  children?: TreeNode[];
}

export type FetchOptions = (params: {
  q?: string;
  ids?: string[];
  page?: number;
}) => Promise<LookupItem[] | PaginatedResponse<LookupItem>>;

export type TreeFetchOptions = (params: {
  q?: string;
  ids?: string[];
  page?: number;
  parentId?: string;
}) => Promise<LookupItem[] | PaginatedResponse<TreeNode>>;

// --- Compound component props ---

export interface RelationDrawerRootBaseProps {
  fetchOptions: FetchOptions | TreeFetchOptions;
  queryKey: readonly unknown[];
  children: ReactNode;
  searchDebounce?: number;
  renderItem?: (item: LookupItem) => ReactNode;
  renderSelected?: (item: LookupItem) => ReactNode;
  emptyMessage?: string;
  display?: 'pill' | 'grid';
  gridDisplayProps?: RelationDrawerGridDisplayProps;
}

interface RootSingleFlatProps extends RelationDrawerRootBaseProps {
  multiple?: false;
  tree?: false;
  value: string | null;
  onChange: (value: string | null) => void;
}

interface RootMultipleFlatProps extends RelationDrawerRootBaseProps {
  multiple: true;
  tree?: false;
  value: string[];
  onChange: (value: string[]) => void;
  maxItems?: number;
}

interface RootSingleTreeProps extends RelationDrawerRootBaseProps {
  multiple?: false;
  tree: true;
  value: string | null;
  onChange: (value: string | null) => void;
}

interface RootMultipleTreeProps extends RelationDrawerRootBaseProps {
  multiple: true;
  tree: true;
  value: string[];
  onChange: (value: string[]) => void;
  maxItems?: number;
}

export type RelationDrawerRootProps =
  | RootSingleFlatProps
  | RootMultipleFlatProps
  | RootSingleTreeProps
  | RootMultipleTreeProps;

// --- Trigger props ---

export interface RelationDrawerTriggerProps {
  label?: string;
  description?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  /** When true, renders only the trigger button without Input.Wrapper or selected items display. Useful for placing the trigger in a FormCard header. */
  compact?: boolean;
}

// --- Content props ---

export interface RelationDrawerContentProps {
  title: string;
  children: ReactNode;
  size?: string;
}

// --- List props ---

export interface DrawerFlatListProps {
  renderItem?: (item: LookupItem) => ReactNode;
}

export interface DrawerTreeListProps {
  renderItem?: (item: LookupItem) => ReactNode;
}

// --- All-in-one convenience props ---

interface RelationDrawerBaseProps {
  fetchOptions: FetchOptions | TreeFetchOptions;
  queryKey: readonly unknown[];
  title: string;
  label?: string;
  description?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  renderItem?: (item: LookupItem) => ReactNode;
  renderOption?: (item: LookupItem) => ReactNode;
  renderSelected?: (item: LookupItem) => ReactNode;
  emptyMessage?: string;
  searchDebounce?: number;
  drawerSize?: string;
  display?: 'pill' | 'grid';
  gridDisplayProps?: RelationDrawerGridDisplayProps;
}

interface DrawerSingleProps extends RelationDrawerBaseProps {
  multiple?: false;
  tree?: false;
  value: string | null;
  onChange: (value: string | null) => void;
}

interface DrawerMultipleProps extends RelationDrawerBaseProps {
  multiple: true;
  tree?: false;
  value: string[];
  onChange: (value: string[]) => void;
  maxItems?: number;
}

interface DrawerTreeSingleProps extends RelationDrawerBaseProps {
  multiple?: false;
  tree: true;
  value: string | null;
  onChange: (value: string | null) => void;
}

interface DrawerTreeMultipleProps extends RelationDrawerBaseProps {
  multiple: true;
  tree: true;
  value: string[];
  onChange: (value: string[]) => void;
  maxItems?: number;
}

export type RelationDrawerProps =
  | DrawerSingleProps
  | DrawerMultipleProps
  | DrawerTreeSingleProps
  | DrawerTreeMultipleProps;
