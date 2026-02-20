export type ExportFormat = 'xlsx' | 'csv';

export interface ExportColumnDef {
  /** ag-grid field name (supports dot notation for nested fields: "_count.sessions") */
  field: string;
  /** i18n translation key for the column header (e.g. "common.admin.customers.table.name") */
  headerKey: string;
  /** Resolved header text — set at runtime after i18n translation or frontend override */
  header?: string;
  /** Column data type — controls formatting */
  type: 'text' | 'number' | 'boolean' | 'date' | 'datetime' | 'badge';
  /** Excel column width in character units (default: 15) */
  width?: number;
  /** Maps raw enum/badge values to display labels */
  labelMap?: Record<string, string>;
}
