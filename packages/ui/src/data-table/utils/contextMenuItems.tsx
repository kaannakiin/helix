'use client';

import { Menu } from '@mantine/core';
import {
  AlignLeft,
  Braces,
  Copy,
  Eye,
  FileDown,
  FileSpreadsheet,
  Table,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type {
  ContextMenuConfig,
  ContextMenuItem,
  ContextMenuParams,
  ContextMenuTranslations,
} from '../types/contextMenu.types';
import { copyToClipboard } from './clipboardUtils';

export const DEFAULT_CONTEXT_MENU_TRANSLATIONS: ContextMenuTranslations = {
  view: 'View',
  copy: 'Copy',
  copySelected: 'Copy selected',
  copyAsTable: 'Table (Excel)',
  copyAsJSON: 'JSON',
  copyAsPlainText: 'Plain Text',
  exportGroup: 'Export',
  exportCSV: 'Export as CSV',
  exportExcel: 'Export as Excel',
};

export function buildContextMenuItems<TData>(
  config: ContextMenuConfig<TData>,
  params: ContextMenuParams<TData>,
  onClose: () => void,
  t: ContextMenuTranslations
): ReactNode[] {
  const { row, selectedRows } = params;
  const hasSelection = selectedRows.length > 0;
  const isRowContext = row !== null;
  const effectiveRows = hasSelection ? selectedRows : row ? [row] : [];

  const items: ReactNode[] = [];

  if (config.customItemsPosition === 'before' && config.customItems) {
    items.push(...renderCustomItems(config.customItems, params, onClose));
  }

  if (config.showView !== false && config.onView && isRowContext && !hasSelection) {
    items.push(
      <Menu.Item
        key="view"
        leftSection={<Eye size={14} />}
        onClick={() => {
          config.onView!(row!);
          onClose();
        }}
      >
        {t.view}
      </Menu.Item>
    );
  }

  if (config.showCopy !== false && effectiveRows.length > 0) {
    if (items.length > 0) {
      items.push(<Menu.Divider key="divider-copy" />);
    }

    if (config.onCopy) {
      items.push(
        <Menu.Item
          key="copy"
          leftSection={<Copy size={14} />}
          onClick={() => {
            config.onCopy!(effectiveRows);
            onClose();
          }}
        >
          {hasSelection ? `${t.copySelected} (${selectedRows.length})` : t.copy}
        </Menu.Item>
      );
    } else {
      const copyLabel = hasSelection
        ? `${t.copySelected} (${selectedRows.length})`
        : t.copy;

      items.push(
        <Menu.Sub key="copy-sub">
          <Menu.Sub.Target>
            <Menu.Item leftSection={<Copy size={14} />}>{copyLabel}</Menu.Item>
          </Menu.Sub.Target>
          <Menu.Sub.Dropdown>
            <Menu.Item
              leftSection={<Table size={14} />}
              onClick={() => {
                copyToClipboard(effectiveRows, {
                  format: 'text',
                  columns: config.copyColumns,
                  formatters: config.copyFormatters,
                });
                onClose();
              }}
            >
              {t.copyAsTable}
            </Menu.Item>
            <Menu.Item
              leftSection={<Braces size={14} />}
              onClick={() => {
                copyToClipboard(effectiveRows, { format: 'json' });
                onClose();
              }}
            >
              {t.copyAsJSON}
            </Menu.Item>
            <Menu.Item
              leftSection={<AlignLeft size={14} />}
              onClick={() => {
                copyToClipboard(effectiveRows, {
                  format: 'plain',
                  columns: config.copyColumns,
                  formatters: config.copyFormatters,
                });
                onClose();
              }}
            >
              {t.copyAsPlainText}
            </Menu.Item>
          </Menu.Sub.Dropdown>
        </Menu.Sub>
      );
    }
  }

  const hasExportCSV = config.showExportCSV !== false && !!config.onExportCSV;
  const hasExportExcel = config.showExportExcel !== false && !!config.onExportExcel;

  if (hasExportCSV || hasExportExcel) {
    if (items.length > 0) {
      items.push(<Menu.Divider key="divider-export" />);
    }
    items.push(<Menu.Label key="export-label">{t.exportGroup}</Menu.Label>);

    if (hasExportCSV) {
      items.push(
        <Menu.Item
          key="export-csv"
          leftSection={<FileDown size={14} />}
          onClick={() => {
            config.onExportCSV!(effectiveRows);
            onClose();
          }}
        >
          {t.exportCSV}
        </Menu.Item>
      );
    }

    if (hasExportExcel) {
      items.push(
        <Menu.Item
          key="export-excel"
          leftSection={<FileSpreadsheet size={14} />}
          onClick={() => {
            config.onExportExcel!(effectiveRows);
            onClose();
          }}
        >
          {t.exportExcel}
        </Menu.Item>
      );
    }
  }

  if (config.customItemsPosition !== 'before' && config.customItems) {
    if (items.length > 0 && config.customItems.length > 0) {
      items.push(<Menu.Divider key="divider-custom" />);
    }
    items.push(...renderCustomItems(config.customItems, params, onClose));
  }

  return items;
}

function renderCustomItems<TData>(
  items: ContextMenuItem<TData>[],
  params: ContextMenuParams<TData>,
  onClose: () => void
): ReactNode[] {
  return items
    .filter((item) => {
      const hidden =
        typeof item.hidden === 'function' ? item.hidden(params) : item.hidden;
      return !hidden;
    })
    .map((item) => {
      if (item.type === 'divider') {
        return <Menu.Divider key={item.key} />;
      }
      if (item.type === 'label') {
        return (
          <Menu.Label key={item.key}>
            {typeof item.label === 'function' ? item.label(params) : item.label}
          </Menu.Label>
        );
      }

      const disabled =
        typeof item.disabled === 'function'
          ? item.disabled(params)
          : item.disabled;

      return (
        <Menu.Item
          key={item.key}
          leftSection={item.icon}
          disabled={disabled}
          color={item.color}
          onClick={() => {
            item.onClick?.(params);
            onClose();
          }}
        >
          {typeof item.label === 'function' ? item.label(params) : item.label}
        </Menu.Item>
      );
    });
}
