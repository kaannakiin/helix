'use client';

import type { ColDef } from 'ag-grid-community';
import { useCallback, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'helix-datatable-preferences';

export interface HideableColumn {
  field: string;
  headerName: string;
}

function readHiddenFields(tableId: string): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Record<string, string[]>;
    return parsed[tableId] ?? [];
  } catch {
    return [];
  }
}

function writeHiddenFields(tableId: string, hiddenFields: string[]) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: Record<string, string[]> = raw ? JSON.parse(raw) : {};
    if (hiddenFields.length === 0) {
      delete parsed[tableId];
    } else {
      parsed[tableId] = hiddenFields;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch {}
}

export function useColumnVisibility(
  tableId: string | undefined,
  columns: ColDef[]
) {
  const hideableColumns = useMemo<HideableColumn[]>(() => {
    return columns
      .filter((col) => col.pinned !== 'right' && (col.field || col.colId))
      .map((col) => ({
        field: (col.field ?? col.colId) as string,
        headerName: (col.headerName ?? col.field ?? col.colId) as string,
      }));
  }, [columns]);

  const hideableFieldSet = useMemo(
    () => new Set(hideableColumns.map((c) => c.field)),
    [hideableColumns]
  );

  const [hiddenFields, setHiddenFields] = useState<Set<string>>(
    new Set<string>()
  );

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (!tableId) return;

    const saved = readHiddenFields(tableId);
    const validFields = saved.filter((f) => hideableFieldSet.has(f));
    setHiddenFields(new Set(validFields));
  }, [tableId, hideableFieldSet]);

  const toggleColumn = useCallback(
    (field: string) => {
      if (!tableId) return;

      setHiddenFields((prev) => {
        const next = new Set(prev);
        if (next.has(field)) {
          next.delete(field);
        } else {
          const visibleCount = hideableFieldSet.size - next.size;
          if (visibleCount <= 1) return prev;
          next.add(field);
        }
        writeHiddenFields(tableId, Array.from(next));
        return next;
      });
    },
    [tableId, hideableFieldSet]
  );

  const showAll = useCallback(() => {
    if (!tableId) return;
    setHiddenFields(new Set());
    writeHiddenFields(tableId, []);
  }, [tableId]);

  return { hiddenFields, toggleColumn, showAll, hideableColumns, isMounted };
}
