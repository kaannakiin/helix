'use client';

import { ActionIcon, Menu } from '@mantine/core';
import type { ICellRendererParams } from 'ag-grid-community';
import { EllipsisVertical } from 'lucide-react';
import { useState } from 'react';
import type {
  ContextMenuConfig,
  ContextMenuParams,
  ContextMenuTranslations,
} from '../types/contextMenu.types';
import {
  buildContextMenuItems,
  DEFAULT_CONTEXT_MENU_TRANSLATIONS,
} from '../utils/contextMenuItems';

interface MobileMenuCellRendererParams<TData> extends ICellRendererParams<TData> {
  config: ContextMenuConfig<TData>;
  selectedRowsRef: React.RefObject<TData[]>;
  translations?: ContextMenuTranslations;
}

export function MobileMenuCellRenderer<TData>({
  node,
  data,
  config,
  selectedRowsRef,
  translations,
}: MobileMenuCellRendererParams<TData>) {
  const [opened, setOpened] = useState(false);

  // Loading row guard — same sentinel as LoadingCellRenderer
  if (node.id === undefined || data === undefined) return null;

  const t = translations ?? DEFAULT_CONTEXT_MENU_TRANSLATIONS;
  const selectedRows = selectedRowsRef.current ?? [];

  const params: ContextMenuParams<TData> = {
    row: data,
    selectedRows,
    rowIndex: node.rowIndex ?? null,
    columnId: null,
  };

  const onClose = () => setOpened(false);
  const items = buildContextMenuItems(config, params, onClose, t);

  if (items.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
      }}
    >
      <Menu
        opened={opened}
        onChange={setOpened}
        position="bottom-end"
        withinPortal
      >
        <Menu.Target>
          <ActionIcon
            variant="subtle"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setOpened((o) => !o);
            }}
          >
            <EllipsisVertical size={16} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>{items}</Menu.Dropdown>
      </Menu>
    </div>
  );
}
