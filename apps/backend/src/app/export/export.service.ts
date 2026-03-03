import { format as csvFormat } from '@fast-csv/format';
import { Injectable } from '@nestjs/common';
import type { ExportColumnDef } from '@org/types/export';
import { DateTransformer } from '@org/utils/date-transformer';
import { stream as excelStream } from 'exceljs';
import { PassThrough, type Readable } from 'node:stream';
import type {
  ExportLocaleStrings,
  ExportOptions,
  ExportResourceConfig,
  ExportStreamResult,
} from './types/export.types';

const EXCEL_BATCH_SIZE = 500;
const CSV_BATCH_SIZE = 1000;

const DEFAULT_LOCALE_STRINGS: ExportLocaleStrings = {
  booleanYes: 'Yes',
  booleanNo: 'No',
};

interface FormatContext {
  locale: string;
  localeStrings: ExportLocaleStrings;
}

@Injectable()
export class ExportService {
  async generateExport(
    config: ExportResourceConfig,
    options: ExportOptions
  ): Promise<ExportStreamResult> {
    const columns = this.resolveColumns(
      config.columns,
      options.columns,
      options.headers
    );
    const timestamp = new Date().toISOString().slice(0, 10);
    const baseName = options.filename ?? config.resourceKey;
    const filename = `${baseName}-${timestamp}.${options.format}`;

    const formatCtx = this.buildFormatContext(
      options.locale,
      options.localeStrings
    );

    if (options.format === 'xlsx') {
      return {
        stream: this.generateExcelStream(config, columns, formatCtx),
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename,
      };
    }

    return {
      stream: this.generateCsvStream(config, columns, formatCtx),
      contentType: 'text/csv; charset=utf-8',
      filename,
    };
  }

  private buildFormatContext(
    locale?: string,
    localeStrings?: ExportLocaleStrings
  ): FormatContext {
    return {
      locale: locale ?? 'en',
      localeStrings: localeStrings ?? DEFAULT_LOCALE_STRINGS,
    };
  }

  private resolveColumns(
    available: ExportColumnDef[],
    requested?: string[],
    headerOverrides?: Record<string, string>
  ): ExportColumnDef[] {
    let columns = available;

    if (requested && requested.length > 0) {
      const requestedSet = new Set(requested);
      const filtered = available.filter((col) => requestedSet.has(col.field));
      if (filtered.length > 0) columns = filtered;
    }

    if (headerOverrides) {
      columns = columns.map((col) =>
        headerOverrides[col.field]
          ? { ...col, header: headerOverrides[col.field] }
          : col
      );
    }

    return columns;
  }

  private generateExcelStream(
    config: ExportResourceConfig,
    columns: ExportColumnDef[],
    ctx: FormatContext
  ): Readable {
    const passThrough = new PassThrough();

    const workbook = new excelStream.xlsx.WorkbookWriter({
      stream: passThrough,
      useStyles: true,
    });
    const worksheet = workbook.addWorksheet(config.resourceKey);

    worksheet.columns = columns.map((col) => ({
      header: col.header ?? col.headerKey,
      key: col.field,
      width: col.width ?? 15,
    }));

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.commit();

    const iterator = config.createDataIterator(EXCEL_BATCH_SIZE);

    void (async () => {
      try {
        for await (const batch of iterator) {
          for (const row of batch) {
            const rowData: Record<string, unknown> = {};
            for (const col of columns) {
              rowData[col.field] = this.formatCellValue(
                this.getNestedValue(row, col.field),
                col,
                ctx
              );
            }
            worksheet.addRow(rowData).commit();
          }
        }
        await workbook.commit();
      } catch (err) {
        passThrough.destroy(err as Error);
      }
    })();

    return passThrough;
  }

  private generateCsvStream(
    config: ExportResourceConfig,
    columns: ExportColumnDef[],
    ctx: FormatContext
  ): Readable {
    const csvStream = csvFormat({
      headers: columns.map((col) => col.header ?? col.headerKey),
      writeHeaders: true,
    });

    const iterator = config.createDataIterator(CSV_BATCH_SIZE);

    void (async () => {
      try {
        for await (const batch of iterator) {
          for (const row of batch) {
            const csvRow = columns.map((col) =>
              String(
                this.formatCellValue(
                  this.getNestedValue(row, col.field),
                  col,
                  ctx
                )
              )
            );
            csvStream.write(csvRow);
          }
        }
        csvStream.end();
      } catch (err) {
        csvStream.destroy(err as Error);
      }
    })();

    return csvStream;
  }

  private getNestedValue(data: unknown, path: string): unknown {
    return path
      .split('.')
      .reduce(
        (obj, key) => (obj as Record<string, unknown> | undefined)?.[key],
        data
      );
  }

  private formatCellValue(
    value: unknown,
    col: ExportColumnDef,
    ctx: FormatContext
  ): unknown {
    if (value === null || value === undefined) return '';

    switch (col.type) {
      case 'boolean':
        return value
          ? ctx.localeStrings.booleanYes
          : ctx.localeStrings.booleanNo;
      case 'date':
        return DateTransformer.formatDate(value as string | Date, ctx.locale);
      case 'datetime':
        return DateTransformer.formatDateTime(
          value as string | Date,
          ctx.locale
        );
      case 'badge':
        if (col.labelMap && typeof value === 'string') {
          return col.labelMap[value] ?? value;
        }
        return String(value);
      case 'number':
        return typeof value === 'number' ? value : String(value);
      default:
        return String(value);
    }
  }
}
