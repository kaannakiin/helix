'use client';

import { ActionIcon, Tooltip } from '@mantine/core';
import type { ICellRendererParams } from 'ag-grid-community';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { ExpandableData } from '../types/expandableRow.types';

export interface ExpandToggleParams<TData> {
  isExpandable: (data: TData) => boolean;
  onToggle: (
    api: ICellRendererParams['api'],
    data: TData & ExpandableData
  ) => void;
  expandTooltip?: string;
  collapseTooltip?: string;
}

export function ExpandToggleCellRenderer<TData>(
  props: ICellRendererParams<TData & ExpandableData> & ExpandToggleParams<TData>
) {
  const {
    data,
    node,
    api,
    isExpandable,
    onToggle,
    expandTooltip,
    collapseTooltip,
  } = props;

  if (node.id === undefined || !data) {
    return null;
  }

  if (data.__isChild) {
    return null;
  }

  if (!isExpandable(data as TData)) {
    return null;
  }

  const expanded = data.__isExpanded === true;
  const label = expanded
    ? collapseTooltip ?? 'Collapse'
    : expandTooltip ?? 'Expand';

  return (
    <Tooltip label={label} openDelay={400}>
      <ActionIcon
        variant="subtle"
        size="sm"
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          onToggle(api, data);
        }}
        style={{ cursor: 'pointer' }}
      >
        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </ActionIcon>
    </Tooltip>
  );
}
