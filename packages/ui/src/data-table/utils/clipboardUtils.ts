export interface CopyColumn {
  field: string;
  headerName: string;
}

export interface CopyOptions {
  format?: "json" | "text" | "plain";
  columns?: CopyColumn[];
  formatters?: Record<string, (value: unknown) => string>;
}

export async function copyToClipboard<TData>(
  rows: TData[],
  options?: CopyOptions,
): Promise<void> {
  if (rows.length === 0) return;

  const format = options?.format ?? "text";

  let text: string;
  if (format === "json") {
    text = JSON.stringify(rows, null, 2);
  } else if (format === "plain") {
    const cols = options?.columns;
    const formatters = options?.formatters;

    text = rows
      .map((row) => {
        if (cols && cols.length > 0) {
          return cols
            .map((col) => {
              const raw = (row as Record<string, unknown>)[col.field];
              const value = formatters?.[col.field]
                ? formatters[col.field](raw)
                : String(raw ?? "");
              return `${col.headerName}: ${value}`;
            })
            .join("\n");
        }
        return Object.entries(row as Record<string, unknown>)
          .map(([key, val]) => `${key}: ${String(val ?? "")}`)
          .join("\n");
      })
      .join("\n\n");
  } else if (options?.columns && options.columns.length > 0) {
    const cols = options.columns;
    const formatters = options.formatters;

    const headerRow = cols.map((c) => c.headerName).join("\t");
    const dataRows = rows.map((row) =>
      cols
        .map((col) => {
          const raw = (row as Record<string, unknown>)[col.field];
          if (formatters?.[col.field]) {
            return formatters[col.field](raw);
          }
          return String(raw ?? "");
        })
        .join("\t"),
    );
    text = [headerRow, ...dataRows].join("\n");
  } else {
    const keys = Object.keys(rows[0] as object);
    const headerRow = keys.join("\t");
    const dataRows = rows.map((row) =>
      keys
        .map((key) => String((row as Record<string, unknown>)[key] ?? ""))
        .join("\t"),
    );
    text = [headerRow, ...dataRows].join("\n");
  }

  return navigator.clipboard.writeText(text);
}
