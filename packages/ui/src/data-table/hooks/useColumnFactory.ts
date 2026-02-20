import { useMemo } from "react";
import type { ColDef, ValueGetterParams } from "ag-grid-community";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import localizedFormat from "dayjs/plugin/localizedFormat";
import {
  useDataTableTranslations,
  type DataTableTranslations,
} from "../context/DataTableTranslationContext";
import { TextFilter } from "../components/TextFilter";
import { DateFilter } from "../components/DateFilter";
import { BooleanFilter } from "../components/BooleanFilter";
import { NumberFilter } from "../components/NumberFilter";
import { EnumFilter } from "../components/EnumFilter";
import { BooleanCellRenderer } from "../components/BooleanCellRenderer";
import { BadgeCellRenderer } from "../components/BadgeCellRenderer";
import { LocaleFilter } from "../components/LocaleFilter";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(localizedFormat);

export type ColumnType =
  | "text"
  | "number"
  | "boolean"
  | "date"
  | "datetime"
  | "currency"
  | "percentage"
  | "badge"
  | "locale"
  | "action";

export type FieldPath<T> = (keyof T & string) | (string & {});

export interface ColumnOptions<T> extends Partial<ColDef<T>> {
  type?: ColumnType;
  headerKey?: string;
  currency?: string;
  colorMap?: Record<string, string>;
  enumOptions?: Array<{ value: string; label: string }>;
}

export interface ColumnFactoryOptions {
  locale?: string;
  timezone?: string;
}

const serverSideDoesFilterPass = () => true;

function getNestedValue(data: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce(
      (obj, key) => (obj as Record<string, unknown> | undefined)?.[key],
      data,
    );
}

function isNestedField(field: string): boolean {
  return field.includes(".");
}

export function useColumnFactory(
  translations?: DataTableTranslations,
  options?: ColumnFactoryOptions,
) {
  const contextTranslations = useDataTableTranslations();
  const resolvedTranslations = translations ?? contextTranslations;
  const tz =
    options?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const locale = options?.locale?.toLowerCase() ?? "en";

  return useMemo(() => {
    const resolveHeader = (
      field: string,
      headerKey?: string,
      headerName?: string,
    ): string => {
      if (headerKey && resolvedTranslations.columns?.[headerKey]) {
        return resolvedTranslations.columns[headerKey];
      }
      if (headerName) {
        return headerName;
      }
      const lastSegment = field.includes(".") ? field.split(".").pop()! : field;
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
      type: "numericColumn",
      sortable: true,
      filter: {
        component: NumberFilter,
        doesFilterPass: serverSideDoesFilterPass,
      },
      cellStyle: { textAlign: "right" },
      valueFormatter: (params) => {
        if (params.value === null || params.value === undefined) return "";
        return Number(params.value).toLocaleString(locale);
      },
      flex: 1,
      minWidth: 80,
    });

    const buildBooleanConfig = <T>(): Partial<ColDef<T>> => ({
      cellRenderer: BooleanCellRenderer,
      sortable: true,
      filter: {
        component: BooleanFilter,
        doesFilterPass: serverSideDoesFilterPass,
      },
      flex: 0,
      width: 100,
    });

    const buildDateConfig = <T>(): Partial<ColDef<T>> => ({
      sortable: true,
      filter: {
        component: DateFilter,
        doesFilterPass: serverSideDoesFilterPass,
      },
      valueFormatter: (params) => {
        if (!params.value) return "";
        return dayjs(params.value).tz(tz).locale(locale).format("L");
      },
      resizable: true,
      flex: 1,
      minWidth: 100,
    });

    const buildDateTimeConfig = <T>(): Partial<ColDef<T>> => ({
      sortable: true,
      filter: {
        component: DateFilter,
        doesFilterPass: serverSideDoesFilterPass,
      },
      valueFormatter: (params) => {
        if (!params.value) return "";
        return dayjs(params.value).tz(tz).locale(locale).format("L LT");
      },
      resizable: true,
      flex: 1,
      minWidth: 100,
    });

    const buildCurrencyConfig = <T>(
      currencyCode: string,
    ): Partial<ColDef<T>> => ({
      type: "numericColumn",
      sortable: true,
      filter: false,
      cellStyle: { textAlign: "right" },
      valueFormatter: (params) => {
        if (params.value === null || params.value === undefined) return "";
        return new Intl.NumberFormat(locale, {
          style: "currency",
          currency: currencyCode,
        }).format(params.value);
      },
      flex: 1,
      minWidth: 100,
    });

    const buildPercentageConfig = <T>(): Partial<ColDef<T>> => ({
      type: "numericColumn",
      sortable: true,
      filter: false,
      cellStyle: { textAlign: "right" },
      valueFormatter: (params) => {
        if (params.value === null || params.value === undefined) return "";
        return `${Number(params.value).toFixed(2)}%`;
      },
      flex: 1,
      minWidth: 80,
    });

    const buildBadgeConfig = <T>(
      colorMap: Record<string, string>,
      enumOptions?: Array<{ value: string; label: string }>,
    ): Partial<ColDef<T>> => ({
      cellRenderer: BadgeCellRenderer,
      cellRendererParams: { colorMap },
      sortable: true,
      filter: enumOptions
        ? {
            component: EnumFilter,
            params: { options: enumOptions },
            doesFilterPass: serverSideDoesFilterPass,
          }
        : false,
      flex: 1,
      minWidth: 100,
    });

    const buildLocaleConfig = <T>(): Partial<ColDef<T>> => ({
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
      sortable: false,
      filter: false,
      resizable: false,
      flex: 0,
      width: 120,
      pinned: "right" as const,
    });

    const createColumn = <T>(
      field: FieldPath<T>,
      columnOptions: ColumnOptions<T> = {},
    ): ColDef<T> => {
      const {
        type: columnType = "text",
        headerKey,
        headerName,
        currency: currencyCode,
        colorMap,
        enumOptions,
        ...rest
      } = columnOptions;

      let typeConfig: Partial<ColDef<T>>;
      switch (columnType) {
        case "number":
          typeConfig = buildNumberConfig<T>();
          break;
        case "boolean":
          typeConfig = buildBooleanConfig<T>();
          break;
        case "date":
          typeConfig = buildDateConfig<T>();
          break;
        case "datetime":
          typeConfig = buildDateTimeConfig<T>();
          break;
        case "currency":
          typeConfig = buildCurrencyConfig<T>(currencyCode ?? "USD");
          break;
        case "percentage":
          typeConfig = buildPercentageConfig<T>();
          break;
        case "badge":
          typeConfig = buildBadgeConfig<T>(colorMap ?? {}, enumOptions);
          break;
        case "locale":
          typeConfig = buildLocaleConfig<T>();
          break;
        case "action":
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
            field: field as ColDef<T>["field"],
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
