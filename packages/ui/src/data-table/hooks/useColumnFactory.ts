import { DateTransformer } from '@org/utils/date-transformer';
import type { ColDef, ValueGetterParams } from 'ag-grid-community';
import { useMemo } from 'react';
import { BadgeCellRenderer } from '../components/BadgeCellRenderer';
import { BooleanCellRenderer } from '../components/BooleanCellRenderer';
import { BooleanFilter } from '../components/BooleanFilter';
import { DateFilter } from '../components/DateFilter';
import { EnumFilter } from '../components/EnumFilter';
import { LocaleFilter } from '../components/LocaleFilter';
import { NumberFilter } from '../components/NumberFilter';
import { TextFilter } from '../components/TextFilter';
import {
  useDataTableTranslations,
  type DataTableTranslations,
} from '../context/DataTableTranslationContext';

export type ColumnType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'currency'
  | 'percentage'
  | 'badge'
  | 'locale'
  | 'action';

export type FieldPath<T> = (keyof T & string) | (string & {});

export type DateStyle = 'standard' | 'compact' | 'full' | 'relative';

export interface ColumnOptions<T> extends Partial<ColDef<T>> {
  type?: ColumnType;
  headerKey?: string;
  currency?: string;
  colorMap?: Record<string, string>;
  enumOptions?: Array<{ value: string; label: string }>;
  dateStyle?: DateStyle;
}

export interface ColumnFactoryOptions {
  locale?: string;
  timezone?: string;
}

const serverSideDoesFilterPass = () => true;

function getNestedValue(data: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce(
      (obj, key) => (obj as Record<string, unknown> | undefined)?.[key],
      data
    );
}

function isNestedField(field: string): boolean {
  return field.includes('.');
}

export function useColumnFactory(
  translations?: DataTableTranslations,
  options?: ColumnFactoryOptions
) {
  const contextTranslations = useDataTableTranslations();
  const resolvedTranslations = translations ?? contextTranslations;
  const tz =
    options?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const locale = options?.locale?.toLowerCase() ?? 'en';

  return useMemo(() => {
    const resolveHeader = (
      field: string,
      headerKey?: string,
      headerName?: string
    ): string => {
      if (headerKey && resolvedTranslations.columns?.[headerKey]) {
        return resolvedTranslations.columns[headerKey];
      }
      if (headerName) {
        return headerName;
      }
      const lastSegment = field.includes('.') ? field.split('.').pop()! : field;
      return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
    };

    const buildTextConfig = <T>(): Partial<ColDef<T>> => ({
      sortable: true,
      filter: {
        component: TextFilter,
        doesFilterPass: serverSideDoesFilterPass,
      },
      resizable: true,
      flex: 1,
      minWidth: 100,
    });

    const buildNumberConfig = <T>(): Partial<ColDef<T>> => ({
      type: 'numericColumn',
      sortable: true,
      filter: {
        component: NumberFilter,
        doesFilterPass: serverSideDoesFilterPass,
      },
      cellStyle: { textAlign: 'right' },
      valueFormatter: (params) => {
        if (params.value === null || params.value === undefined) return '';
        return Number(params.value).toLocaleString(locale);
      },
      flex: 1,
      minWidth: 80,
    });

    const buildBooleanConfig = <T>(): Partial<ColDef<T>> => ({
      type: 'booleanColumn',
      cellRenderer: BooleanCellRenderer,
      sortable: true,

      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
      filter: {
        component: BooleanFilter,
        doesFilterPass: serverSideDoesFilterPass,
      },
      flex: 0,
      width: 100,
    });

    const buildDateConfig = <T>(
      style: DateStyle = 'standard'
    ): Partial<ColDef<T>> => ({
      type: 'dateColumn',
      sortable: true,
      filter: {
        component: DateFilter,
        doesFilterPass: serverSideDoesFilterPass,
      },
      valueFormatter: (params) =>
        DateTransformer.formatDate(
          params.value as string | Date,
          locale,
          tz,
          style
        ),
      resizable: true,
      flex: 1,
      minWidth: 100,
    });

    const buildDateTimeConfig = <T>(
      style: DateStyle = 'standard'
    ): Partial<ColDef<T>> => ({
      type: 'datetimeColumn',
      sortable: true,
      filter: {
        component: DateFilter,
        doesFilterPass: serverSideDoesFilterPass,
      },
      valueFormatter: (params) =>
        DateTransformer.formatDateTime(
          params.value as string | Date,
          locale,
          tz,
          style
        ),
      resizable: true,
      flex: 1,
      minWidth: 100,
    });

    const buildCurrencyConfig = <T>(
      currencyCode: string
    ): Partial<ColDef<T>> => ({
      type: 'numericColumn',
      sortable: true,
      filter: false,
      cellStyle: { textAlign: 'right' },
      valueFormatter: (params) => {
        if (params.value === null || params.value === undefined) return '';
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: currencyCode,
        }).format(params.value);
      },
      flex: 1,
      minWidth: 100,
    });

    const buildPercentageConfig = <T>(): Partial<ColDef<T>> => ({
      type: 'numericColumn',
      sortable: true,
      filter: false,
      cellStyle: { textAlign: 'right' },
      valueFormatter: (params) => {
        if (params.value === null || params.value === undefined) return '';
        return `${Number(params.value).toFixed(2)}%`;
      },
      flex: 1,
      minWidth: 80,
    });

    const buildBadgeConfig = <T>(
      colorMap: Record<string, string>,
      enumOptions?: Array<{ value: string; label: string }>
    ): Partial<ColDef<T>> => {
      const labelMap = enumOptions
        ? Object.fromEntries(enumOptions.map((o) => [o.value, o.label]))
        : undefined;

      return {
        type: 'badgeColumn',
        cellRenderer: BadgeCellRenderer,
        cellRendererParams: { colorMap, labelMap },
        sortable: true,
        cellStyle: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        filter: enumOptions
          ? {
              component: EnumFilter,
              params: { options: enumOptions },
              doesFilterPass: serverSideDoesFilterPass,
            }
          : false,
        flex: 1,
        minWidth: 100,
      };
    };

    const buildLocaleConfig = <T>(): Partial<ColDef<T>> => ({
      type: 'localeColumn',
      sortable: true,
      filter: {
        component: LocaleFilter,
        doesFilterPass: serverSideDoesFilterPass,
      },
      maxWidth: 120,
      flex: 1,
      minWidth: 80,
    });

    const buildActionConfig = <T>(): Partial<ColDef<T>> => ({
      type: 'actionColumn',
      sortable: false,
      filter: false,
      resizable: false,
      flex: 0,
      width: 120,
      pinned: 'right' as const,
    });

    const createColumn = <T>(
      field: FieldPath<T>,
      columnOptions: ColumnOptions<T> = {}
    ): ColDef<T> => {
      const {
        type: columnType = 'text',
        headerKey,
        headerName,
        currency: currencyCode,
        colorMap,
        enumOptions,
        dateStyle,
        ...rest
      } = columnOptions;

      let typeConfig: Partial<ColDef<T>>;
      switch (columnType) {
        case 'number':
          typeConfig = buildNumberConfig<T>();
          break;
        case 'boolean':
          typeConfig = buildBooleanConfig<T>();
          break;
        case 'date':
          typeConfig = buildDateConfig<T>(dateStyle);
          break;
        case 'datetime':
          typeConfig = buildDateTimeConfig<T>(dateStyle);
          break;
        case 'currency':
          typeConfig = buildCurrencyConfig<T>(currencyCode ?? 'USD');
          break;
        case 'percentage':
          typeConfig = buildPercentageConfig<T>();
          break;
        case 'badge':
          typeConfig = buildBadgeConfig<T>(colorMap ?? {}, enumOptions);
          break;
        case 'locale':
          typeConfig = buildLocaleConfig<T>();
          break;
        case 'action':
          typeConfig = buildActionConfig<T>();
          break;
        default:
          typeConfig = buildTextConfig<T>();
          break;
      }

      const nested = isNestedField(field);
      const fieldConfig: Partial<ColDef<T>> = nested
        ? {
            colId: field,
            valueGetter: (params: ValueGetterParams<T>) =>
              getNestedValue(params.data, field) ?? 0,
            sortable: false,
          }
        : {
            field: field as ColDef<T>['field'],
          };

      return {
        headerName: resolveHeader(field, headerKey, headerName),
        ...typeConfig,
        ...fieldConfig,
        ...rest,
      } as ColDef<T>;
    };

    return { createColumn };
  }, [resolvedTranslations, tz, locale]);
}
