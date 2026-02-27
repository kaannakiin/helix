import type { ComponentType } from 'react';

export type ExpandableData = {
  __isExpanded?: boolean;
  __isChild?: boolean;
  __parentId?: string;
};

export interface ExpandableRowConfig<TData> {
  isExpandable?: (row: TData) => boolean;
  fullWidthCellRenderer: ComponentType<{ data: TData }>;
  getRowId: (data: TData) => string;
  expandOnRowClick?: boolean;
  singleExpand?: boolean;
  detailHeight?: number;
  getDetailHeight?: (row: TData) => number;
  expandColumnWidth?: number;
}

export interface ExpandableRowTranslations {
  expand?: string;
  collapse?: string;
}
