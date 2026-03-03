import type {
  DataQueryParams,
  FilterCondition,
  PlainSortCondition,
} from '@org/types/data-query';
import type { SortModelItem } from 'ag-grid-community';

interface AgTextFilterModel {
  filterType: 'text';
  type: string;
  filter: string;
}

interface AgNumberFilterModel {
  filterType: 'number';
  type: string;
  filter: number;
  filterTo?: number;
}

interface AgDateFilterModel {
  filterType: 'date';
  type: string;
  dateFrom: string;
  dateTo?: string;
}

interface AgBooleanFilterModel {
  filterType: 'boolean';
  filter: boolean;
}

interface AgCustomFilterModel {
  filterType: 'custom';
  value: string;
}

type AgFilterModelEntry =
  | AgTextFilterModel
  | AgNumberFilterModel
  | AgDateFilterModel
  | AgBooleanFilterModel
  | AgCustomFilterModel;

type AgFilterModel = Record<string, AgFilterModelEntry>;

const AG_DATE_OP_MAP: Record<string, string> = {
  equals: 'equals',
  greaterThan: 'gt',
  lessThan: 'lt',
  inRange: 'between',
};

const AG_NUMBER_OP_MAP: Record<string, string> = {
  equals: 'equals',
  greaterThan: 'gt',
  lessThan: 'lt',
  greaterThanOrEqual: 'gte',
  lessThanOrEqual: 'lte',
  inRange: 'between',
};

function convertAgFilter(agFilter: AgFilterModelEntry): FilterCondition | null {
  switch (agFilter.filterType) {
    case 'text':
      return {
        filterType: 'text',
        op:
          (agFilter.type as FilterCondition extends { op: infer O }
            ? O
            : never) || 'contains',
        value: agFilter.filter,
      } as FilterCondition;

    case 'number':
      return {
        filterType: 'number',
        op: AG_NUMBER_OP_MAP[agFilter.type] || 'equals',
        value: agFilter.filter,
        ...(agFilter.filterTo !== undefined
          ? { valueTo: agFilter.filterTo }
          : {}),
      } as FilterCondition;

    case 'date':
      return {
        filterType: 'date',
        op: AG_DATE_OP_MAP[agFilter.type] || 'equals',
        value: agFilter.dateFrom,
        ...(agFilter.dateTo ? { valueTo: agFilter.dateTo } : {}),
      } as FilterCondition;

    case 'boolean':
      return {
        filterType: 'boolean',
        op: 'equals',
        value: agFilter.filter,
      };

    case 'custom':
      return {
        filterType: 'enum',
        op: 'equals',
        value: agFilter.value,
      };

    default:
      return null;
  }
}

export function serializeGridQuery(params: {
  startRow: number;
  endRow: number;
  filterModel?: AgFilterModel | null;
  sortModel?: SortModelItem[] | null;
}): DataQueryParams {
  const { startRow, endRow, filterModel, sortModel } = params;
  const limit = endRow - startRow;
  const page = Math.floor(startRow / limit) + 1;

  const query: DataQueryParams = { page, limit };

  if (filterModel && Object.keys(filterModel).length > 0) {
    const filters: Record<string, FilterCondition> = {};
    for (const [field, agFilter] of Object.entries(filterModel)) {
      const condition = convertAgFilter(agFilter);
      if (condition) {
        filters[field] = condition;
      }
    }
    if (Object.keys(filters).length > 0) {
      query.filters = filters;
    }
  }

  if (sortModel && sortModel.length > 0) {
    const sort: PlainSortCondition[] = sortModel.map((s) => ({
      field: s.colId,
      order: s.sort as 'asc' | 'desc',
    }));
    query.sort = sort;
  }

  return query;
}
