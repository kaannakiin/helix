import type { ReactNode } from "react";
import type { CopyColumn } from "../utils/clipboardUtils";

export type ContextMenuItemType = "item" | "divider" | "label";

export interface ContextMenuItem<TData = unknown> {
  type?: ContextMenuItemType;
  key: string;
  label?: string | ((params: ContextMenuParams<TData>) => string);
  icon?: ReactNode;
  disabled?: boolean | ((params: ContextMenuParams<TData>) => boolean);
  hidden?: boolean | ((params: ContextMenuParams<TData>) => boolean);
  onClick?: (params: ContextMenuParams<TData>) => void;
  color?: string;
}

export interface ContextMenuParams<TData> {
  row: TData | null;
  selectedRows: TData[];
  rowIndex: number | null;
  columnId: string | null;
}

export interface ContextMenuConfig<TData> {
  enabled?: boolean;
  onView?: (row: TData) => void;
  onCopy?: (rows: TData[]) => void;
  onExportCSV?: (rows: TData[]) => void;
  onExportExcel?: (rows: TData[]) => void;
  customItems?: ContextMenuItem<TData>[];
  customItemsPosition?: "before" | "after";
  showCopy?: boolean;
  showExportCSV?: boolean;
  showExportExcel?: boolean;
  showView?: boolean;
  copyColumns?: CopyColumn[];
  copyFormatters?: Record<string, (value: unknown) => string>;
}

export interface ContextMenuState<TData> {
  isOpen: boolean;
  position: { x: number; y: number };
  row: TData | null;
  rowIndex: number | null;
  columnId: string | null;
}

export interface ContextMenuTranslations {
  view: string;
  copy: string;
  copySelected: string;
  copyAsTable: string;
  copyAsJSON: string;
  copyAsPlainText: string;
  exportGroup: string;
  exportCSV: string;
  exportExcel: string;
}
