// ─── Filter Operation Constants ───

export const TEXT_FILTER_OPS = [
  'contains',
  'equals',
  'startsWith',
  'endsWith',
] as const;

export const NUMBER_FILTER_OPS = [
  'equals',
  'gt',
  'lt',
  'gte',
  'lte',
  'between',
] as const;

export const DATE_FILTER_OPS = ['equals', 'gt', 'lt', 'between'] as const;

export const BOOLEAN_FILTER_OPS = ['equals'] as const;

export const ENUM_FILTER_OPS = ['equals', 'in'] as const;

export const FILTER_TYPES = [
  'text',
  'number',
  'date',
  'boolean',
  'enum',
] as const;

export const SORT_ORDERS = ['asc', 'desc'] as const;

// ─── Filter Operation Types (derived from constants) ───

export type TextFilterOp = (typeof TEXT_FILTER_OPS)[number];
export type NumberFilterOp = (typeof NUMBER_FILTER_OPS)[number];
export type DateFilterOp = (typeof DATE_FILTER_OPS)[number];
export type BooleanFilterOp = (typeof BOOLEAN_FILTER_OPS)[number];
export type EnumFilterOp = (typeof ENUM_FILTER_OPS)[number];
export type FilterType = (typeof FILTER_TYPES)[number];
export type SortOrder = (typeof SORT_ORDERS)[number];

// ─── Filter Condition Types (discriminated union) ───

export interface TextFilterCondition {
  filterType: 'text';
  op: TextFilterOp;
  value: string;
}

export interface NumberFilterCondition {
  filterType: 'number';
  op: NumberFilterOp;
  value: number;
  valueTo?: number;
}

export interface DateFilterCondition {
  filterType: 'date';
  op: DateFilterOp;
  value: string; // ISO 8601
  valueTo?: string;
}

export interface BooleanFilterCondition {
  filterType: 'boolean';
  op: BooleanFilterOp;
  value: boolean;
}

export interface EnumFilterCondition {
  filterType: 'enum';
  op: EnumFilterOp;
  value: string | string[];
}

export type FilterCondition =
  | TextFilterCondition
  | NumberFilterCondition
  | DateFilterCondition
  | BooleanFilterCondition
  | EnumFilterCondition;

// ─── Sort ───

export interface SortCondition {
  field: string;
  order: SortOrder;
}

// ─── Full Query ───

export interface DataQueryParams {
  page: number;
  limit: number;
  filters?: Record<string, FilterCondition>;
  sort?: SortCondition[];
}

// ─── Field Config (single source of truth per entity) ───

export interface FieldFilterConfig {
  filterType: FilterType;
  values?: readonly string[];
}
