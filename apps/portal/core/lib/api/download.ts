import type { ExportFormat } from '@org/types/export';
import { apiClient } from './api-client';

export interface DownloadExportParams {
  endpoint: string;
  format: ExportFormat;
  columns?: string[];
  headers?: Record<string, string>;
  filters?: string;
  sort?: string;
  filename?: string;
}

export async function downloadExport(
  params: DownloadExportParams
): Promise<void> {
  const queryParams: Record<string, string> = {
    format: params.format,
  };

  if (params.columns && params.columns.length > 0) {
    queryParams.columns = JSON.stringify(params.columns);
  }
  if (params.headers) {
    queryParams.headers = JSON.stringify(params.headers);
  }
  if (params.filters) {
    queryParams.filters = params.filters;
  }
  if (params.sort) {
    queryParams.sort = params.sort;
  }
  if (params.filename) {
    queryParams.filename = params.filename;
  }

  const response = await apiClient.get(params.endpoint, {
    params: queryParams,
    responseType: 'blob',
  });

  const contentDisposition = response.headers['content-disposition'] as
    | string
    | undefined;
  const filenameFromHeader = contentDisposition
    ?.match(/filename="?([^";\n]+)"?/)?.[1]
    ?.trim();

  const fallbackFilename = `export.${params.format}`;
  const downloadFilename = filenameFromHeader ?? fallbackFilename;

  const url = URL.createObjectURL(response.data as Blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = downloadFilename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
