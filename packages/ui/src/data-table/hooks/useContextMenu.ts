"use client";

import type { CellContextMenuEvent } from "ag-grid-community";
import { useEventListener } from "@mantine/hooks";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ContextMenuState } from "../types/contextMenu.types";

interface UseContextMenuOptions {
  enabled: boolean;
}

export function useContextMenu<TData>(
  options: UseContextMenuOptions = { enabled: true },
) {
  const { enabled } = options;
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [state, setState] = useState<ContextMenuState<TData>>({
    isOpen: false,
    position: { x: 0, y: 0 },
    row: null,
    rowIndex: null,
    columnId: null,
  });

  const pendingPositionRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || !enabled) return;

    const handleNativeContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isInGrid =
        target.closest(".ag-body-viewport") ||
        target.closest(".ag-center-cols-viewport") ||
        target.closest(".ag-row");

      if (isInGrid) {
        e.preventDefault();
        pendingPositionRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    wrapper.addEventListener("contextmenu", handleNativeContextMenu, true);

    return () => {
      wrapper.removeEventListener("contextmenu", handleNativeContextMenu, true);
    };
  }, [enabled]);

  useEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Escape" && state.isOpen) {
      setState((prev) => ({ ...prev, isOpen: false }));
    }
  });

  const handleCellContextMenu = useCallback(
    (event: CellContextMenuEvent<TData>) => {
      const mouseEvent = event.event as MouseEvent | undefined;
      const position = pendingPositionRef.current ?? {
        x: mouseEvent?.clientX ?? 0,
        y: mouseEvent?.clientY ?? 0,
      };
      pendingPositionRef.current = null;

      setState({
        isOpen: true,
        position,
        row: event.data ?? null,
        rowIndex: event.rowIndex ?? null,
        columnId: event.column?.getColId() ?? null,
      });
    },
    [],
  );

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return {
    wrapperRef,
    state,
    handleCellContextMenu,
    close,
  };
}
