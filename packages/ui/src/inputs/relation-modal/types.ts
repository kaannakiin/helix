import type { PaginatedResponse } from '@org/types/pagination';
import type { ReactNode } from 'react';
import type { LookupItem } from '../relation-input/types';

export type { LookupItem };

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

interface RelationModalBaseProps {
  fetchOptions: FetchOptions | TreeFetchOptions;
  queryKey: readonly unknown[];

  title: string;
  label?: string;
  description?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;

  renderOption?: (item: LookupItem) => ReactNode;
  renderSelected?: (item: LookupItem) => ReactNode;
  emptyMessage?: string;
  searchDebounce?: number;
}

interface RelationModalSingleProps extends RelationModalBaseProps {
  multiple?: false;
  tree?: false;
  value: string | null;
  onChange: (value: string | null) => void;
}

interface RelationModalMultipleProps extends RelationModalBaseProps {
  multiple: true;
  tree?: false;
  value: string[];
  onChange: (value: string[]) => void;
  maxItems?: number;
}

interface RelationModalTreeMultipleProps extends RelationModalBaseProps {
  multiple: true;
  tree: true;
  value: string[];
  onChange: (value: string[]) => void;
  maxItems?: number;
}

interface RelationModalTreeSingleProps extends RelationModalBaseProps {
  multiple?: false;
  tree: true;
  value: string | null;
  onChange: (value: string | null) => void;
}

export type RelationModalProps =
  | RelationModalSingleProps
  | RelationModalMultipleProps
  | RelationModalTreeMultipleProps
  | RelationModalTreeSingleProps;
