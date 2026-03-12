'use client';

import { Menu, Portal } from '@mantine/core';
import {
  useClickOutside,
  useEventListener,
  useViewportSize,
} from '@mantine/hooks';
import { useEffect, useRef, useState } from 'react';
import type {
  ContextMenuConfig,
  ContextMenuParams,
  ContextMenuState,
  ContextMenuTranslations,
} from '../types/contextMenu.types';
import {
  buildContextMenuItems,
  DEFAULT_CONTEXT_MENU_TRANSLATIONS,
} from '../utils/contextMenuItems';

interface ContextMenuProps<TData> {
  state: ContextMenuState<TData>;
  config: ContextMenuConfig<TData>;
  selectedRows: TData[];
  onClose: () => void;
  translations?: ContextMenuTranslations;
}

const VIEWPORT_PADDING = 8;

export function ContextMenu<TData>({
  state,
  config,
  selectedRows,
  onClose,
  translations,
}: ContextMenuProps<TData>) {
  const t = translations ?? DEFAULT_CONTEXT_MENU_TRANSLATIONS;
  const clickOutsideRef = useClickOutside(onClose);
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(state.position);
  const [visible, setVisible] = useState(false);
  const { width: vw, height: vh } = useViewportSize();

  useEventListener('resize', onClose);

  useEffect(() => {
    if (!state.isOpen) {
      setVisible(false);
      setAdjustedPosition(state.position);
      return;
    }

    setVisible(false);

    const rafId = requestAnimationFrame(() => {
      const menuEl = menuRef.current;
      if (!menuEl) {
        setAdjustedPosition(state.position);
        setVisible(true);
        return;
      }

      const dropdown =
        menuEl.querySelector('.mantine-Menu-dropdown') ??
        menuEl.firstElementChild ??
        menuEl;
      const rect = dropdown.getBoundingClientRect();
      let x = state.position.x;
      let y = state.position.y;

      if (x + rect.width > vw - VIEWPORT_PADDING) {
        x = Math.max(VIEWPORT_PADDING, x - rect.width);
      }
      if (y + rect.height > vh - VIEWPORT_PADDING) {
        y = Math.max(VIEWPORT_PADDING, y - rect.height);
      }

      setAdjustedPosition({ x, y });
      setVisible(true);
    });

    return () => cancelAnimationFrame(rafId);
  }, [state.isOpen, state.position, vw, vh]);

  const params: ContextMenuParams<TData> = {
    row: state.row,
    selectedRows,
    rowIndex: state.rowIndex,
    columnId: state.columnId,
  };

  const items = buildContextMenuItems(config, params, onClose, t);
  const isEmpty = items.length === 0;

  return (
    <Portal>
      <div
        ref={(el) => {
          (clickOutsideRef as React.RefObject<HTMLDivElement | null>).current =
            el;
          menuRef.current = el;
        }}
        style={{
          position: 'fixed',
          left: adjustedPosition.x,
          top: adjustedPosition.y,
          zIndex: 9999,
          visibility: visible && !isEmpty ? 'visible' : 'hidden',
          pointerEvents: visible && !isEmpty ? 'auto' : 'none',
        }}
      >
        <Menu opened={true} onClose={onClose} withinPortal={false}>
          <Menu.Dropdown>{items}</Menu.Dropdown>
        </Menu>
      </div>
    </Portal>
  );
}
