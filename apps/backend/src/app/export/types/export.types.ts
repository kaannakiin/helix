import type { Readable } from 'node:stream';
import type { ExportColumnDef, ExportFormat } from '@org/types/export';

export interface ExportResourceConfig<TData = unknown> {
  resourceKey: string;
  columns: ExportColumnDef[];
  createDataIterator: (batchSize: number) => AsyncIterable<TData[]>;
}

export interface ExportLocaleStrings {
  booleanYes: string;
  booleanNo: string;
}

export interface ExportOptions {
  format: ExportFormat;
  columns?: string[];
  /** Frontend header overrides: { field: translatedHeader } */
  headers?: Record<string, string>;
  filename?: string;
  /** Locale for date/time formatting (e.g. 'en', 'tr') */
  locale?: string;
  /** Translated strings for boolean values etc. */
  localeStrings?: ExportLocaleStrings;
}

export interface ExportStreamResult {
  stream: Readable;
  contentType: string;
  filename: string;
}
