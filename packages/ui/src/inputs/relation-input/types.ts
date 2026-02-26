import type { MantineSize, StyleProp } from '@mantine/core';
import type { PaginatedResponse } from '@org/types/pagination';
import type { ReactNode } from 'react';

export interface LookupItem {
  id: string;
  label: string;
  slug?: string;
  imageUrl?: string;
  group?: string;
  extra?: Record<string, unknown>;
}

export type FetchOptions = (params: {
  q?: string;
  ids?: string[];
  page?: number;
}) => Promise<LookupItem[] | PaginatedResponse<LookupItem>>;

interface RelationInputBaseProps {
  fetchOptions: FetchOptions;
  queryKey: readonly unknown[];

  label?: string;
  description?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  size?: MantineSize;
  w?: StyleProp<React.CSSProperties['width']>;

  renderOption?: (item: LookupItem) => ReactNode;
  renderSelected?: (item: LookupItem) => ReactNode;
  emptyMessage?: string;
  searchDebounce?: number;
}

interface RelationInputSingleProps extends RelationInputBaseProps {
  multiple?: false;
  value: string | null;
  onChange: (value: string | null) => void;
  clearable?: boolean;
}

interface RelationInputMultiProps extends RelationInputBaseProps {
  multiple: true;
  sortable?: false;
  value: string[];
  onChange: (value: string[]) => void;
  maxItems?: number;
}

interface RelationInputSortableProps extends RelationInputBaseProps {
  multiple: true;
  sortable: true;
  value: string[];
  onChange: (value: string[]) => void;
  maxItems?: number;
}

export type RelationInputProps =
  | RelationInputSingleProps
  | RelationInputMultiProps
  | RelationInputSortableProps;
