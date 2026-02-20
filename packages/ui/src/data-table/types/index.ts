import type { ColDef, GridOptions, IDatasource } from "ag-grid-community";

export type { PaginatedResponse, Pagination } from "@org/types/pagination";

export interface DataTableSort {
  field: string;
  direction: "asc" | "desc";
}

// For multi-column sorting support
export type DataTableSortModel = DataTableSort[];

export interface DataTableFilter {
  [key: string]: string | number | boolean | null;
}

export type { ColDef, GridOptions, IDatasource };

export type {
  ContextMenuConfig,
  ContextMenuItem,
  ContextMenuItemType,
  ContextMenuParams,
  ContextMenuState,
  ContextMenuTranslations,
} from "./contextMenu.types";

export type { DataTableFooterTranslations } from "./footer.types";
