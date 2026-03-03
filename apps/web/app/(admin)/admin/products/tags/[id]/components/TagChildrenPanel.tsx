'use client';

import { useTagChildren } from '@/core/hooks/useAdminTagGroup';
import {
  ActionIcon,
  Center,
  Group,
  Loader,
  Text,
  Tooltip,
} from '@mantine/core';
import type { RecursiveTagInput } from '@org/schemas/admin/tags';
import type { AdminTagChildrenPrismaType } from '@org/types/admin/tags';
import {
  ExpandableDataTable,
  useColumnFactory,
  type ExpandableRowConfig,
} from '@org/ui';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import {
  findChildrenInTree,
  formTagToDisplayTag,
} from '../utils/tag-tree-helpers';

interface TagChildrenPanelProps {
  data: AdminTagChildrenPrismaType;
  tagGroupId: string;
  onEditTag: (tag: AdminTagChildrenPrismaType) => void;
  onAddChildTag: (parentTagId: string) => void;
  onDeleteTag: (tag: AdminTagChildrenPrismaType) => void;
  maxDepth: number;
  currentDepth: number;
  isNew?: boolean;
  formTags?: RecursiveTagInput[];
}

export function TagChildrenPanel({
  data,
  tagGroupId,
  onEditTag,
  onAddChildTag,
  onDeleteTag,
  maxDepth,
  currentDepth,
  isNew = false,
  formTags,
}: TagChildrenPanelProps) {
  const t = useTranslations('common.admin.tags.form.tags');
  const { createColumn } = useColumnFactory();

  const { data: apiChildren = [], isLoading } = useTagChildren(
    tagGroupId,
    data.id
  );

  const children = useMemo(() => {
    if (isNew && formTags) {
      const formChildren = findChildrenInTree(formTags, data.id);
      return formChildren.map((tag) => formTagToDisplayTag(tag, currentDepth));
    }
    return apiChildren;
  }, [isNew, formTags, data.id, currentDepth, apiChildren]);

  const columns = useMemo<ColDef<AdminTagChildrenPrismaType>[]>(
    () => [
      createColumn<AdminTagChildrenPrismaType>('id', {
        headerName: t('table.name'),
        type: 'text',
        minWidth: 200,
        valueGetter: (params) =>
          params.data?.translations?.[0]?.name ?? params.data?.slug ?? '',
      }),
      createColumn<AdminTagChildrenPrismaType>('isActive', {
        type: 'boolean',
        headerName: t('table.active'),
        width: 90,
        flex: 0,
      }),
      createColumn<AdminTagChildrenPrismaType>('sortOrder', {
        type: 'number',
        headerName: t('table.sortOrder'),
        width: 100,
        flex: 0,
      }),
      {
        colId: '__children_count__',
        headerName: t('table.children'),
        width: 90,
        flex: 0,
        sortable: false,
        filter: false,
        valueGetter: (params: { data?: AdminTagChildrenPrismaType }) =>
          params.data?._count?.children ?? 0,
      },
      {
        colId: '__actions__',
        headerName: '',
        width: 110,
        flex: 0,
        sortable: false,
        filter: false,
        resizable: false,
        suppressMovable: true,
        cellRenderer: (
          props: ICellRendererParams<AdminTagChildrenPrismaType>
        ) => {
          const row = props.data;
          if (!row || (row as any).__isChild) return null;

          return (
            <Group gap={4} wrap="nowrap" align="center" h="100%">
              <Tooltip label={t('editDrawer.editTitle')}>
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onEditTag(row);
                  }}
                >
                  <Pencil size={14} />
                </ActionIcon>
              </Tooltip>
              {currentDepth < maxDepth && (
                <Tooltip label={t('addChildTag')}>
                  <ActionIcon
                    variant="subtle"
                    size="sm"
                    color="teal"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      onAddChildTag(row.id);
                    }}
                  >
                    <Plus size={14} />
                  </ActionIcon>
                </Tooltip>
              )}
              <Tooltip label={t('deleteTag')}>
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  color="red"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onDeleteTag(row);
                  }}
                >
                  <Trash2 size={14} />
                </ActionIcon>
              </Tooltip>
            </Group>
          );
        },
      },
    ],
    [
      createColumn,
      t,
      onEditTag,
      onAddChildTag,
      onDeleteTag,
      currentDepth,
      maxDepth,
    ]
  );

  const expandableRow = useMemo<
    ExpandableRowConfig<AdminTagChildrenPrismaType>
  >(
    () => ({
      getRowId: (row) => row.id,
      isExpandable: (row) => row._count.children > 0,
      fullWidthCellRenderer: ({ data: childData }) => (
        <TagChildrenPanel
          data={childData}
          tagGroupId={tagGroupId}
          onEditTag={onEditTag}
          onAddChildTag={onAddChildTag}
          onDeleteTag={onDeleteTag}
          maxDepth={maxDepth}
          currentDepth={currentDepth + 1}
          isNew={isNew}
          formTags={formTags}
        />
      ),
      expandOnRowClick: true,
      singleExpand: true,
      detailHeight: 300,
      getDetailHeight: (row) =>
        Math.min(48 * (row._count.children + 1) + 100, 400),
    }),
    [
      tagGroupId,
      onEditTag,
      onAddChildTag,
      onDeleteTag,
      maxDepth,
      currentDepth,
      isNew,
      formTags,
    ]
  );

  if (!isNew && isLoading) {
    return (
      <Center h="100%">
        <Loader size="sm" />
      </Center>
    );
  }

  if (children.length === 0) {
    return (
      <Center h="100%">
        <Text c="dimmed" size="sm">
          {t('empty')}
        </Text>
      </Center>
    );
  }

  return (
    <div style={{ height: '100%', padding: '4px 8px 8px' }}>
      <ExpandableDataTable<AdminTagChildrenPrismaType>
        columns={columns}
        rowData={children}
        height="100%"
        idPrefix={`children-${data.id}`}
        expandableRow={expandableRow}
        gridOptions={{ suppressCellFocus: true }}
      />
    </div>
  );
}
