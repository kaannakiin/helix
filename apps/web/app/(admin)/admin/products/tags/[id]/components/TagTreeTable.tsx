'use client';

import {
  useBulkDeleteTags,
  useDeleteTag,
  useTagChildren,
} from '@/core/hooks/useAdminTagGroup';
import { ActionIcon, Button, Group, Stack, Text, Tooltip } from '@mantine/core';
import { modals } from '@mantine/modals';
import type { RecursiveTagInput, TagGroupInput } from '@org/schemas/admin/tags';
import type { AdminTagChildrenPrismaType } from '@org/types/admin/tags';
import {
  ExpandableDataTable,
  useColumnFactory,
  type ExpandableRowConfig,
} from '@org/ui';
import { FormCard } from '@org/ui/common/form-card';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { Pencil, Plus, Tag, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import {
  formTagToDisplayTag,
  removeTagFromTree,
  removeTagsFromTree,
} from '../utils/tag-tree-helpers';
import { TagChildrenPanel } from './TagChildrenPanel';
import { TagEditDrawer } from './TagEditDrawer';

const MAX_DEPTH = 3;

interface TagTreeTableProps {
  tagGroupId: string;
  isNew: boolean;
}

export const TagTreeTable = ({ tagGroupId, isNew }: TagTreeTableProps) => {
  const t = useTranslations('common.admin.tags.form.tags');
  const { createColumn } = useColumnFactory();
  const { watch, setValue, getValues } = useFormContext<TagGroupInput>();

  const { data: apiRootTags = [], isLoading } = useTagChildren(
    tagGroupId,
    null
  );
  const deleteTag = useDeleteTag(tagGroupId);
  const bulkDeleteTags = useBulkDeleteTags(tagGroupId);

  const formTags = watch('tags') as RecursiveTagInput[] | undefined;

  // Create mode: form state'ten root tag'leri al, Edit mode: API'den
  const rootTags = useMemo(() => {
    if (isNew) {
      return (formTags ?? [])
        .filter((tag) => !tag.parentTagId)
        .map((tag) => formTagToDisplayTag(tag, 0));
    }
    return apiRootTags;
  }, [isNew, formTags, apiRootTags]);

  const [drawerOpened, setDrawerOpened] = useState(false);
  const [editingTag, setEditingTag] =
    useState<AdminTagChildrenPrismaType | null>(null);
  const [drawerParentTagId, setDrawerParentTagId] = useState<string | null>(
    null
  );

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleEditTag = useCallback((tag: AdminTagChildrenPrismaType) => {
    setEditingTag(tag);
    setDrawerParentTagId(tag.parentTagId);
    setDrawerOpened(true);
  }, []);

  const handleAddChildTag = useCallback((parentTagId: string) => {
    setEditingTag(null);
    setDrawerParentTagId(parentTagId);
    setDrawerOpened(true);
  }, []);

  const handleAddRootTag = useCallback(() => {
    setEditingTag(null);
    setDrawerParentTagId(null);
    setDrawerOpened(true);
  }, []);

  const handleDeleteTag = useCallback(
    (tag: AdminTagChildrenPrismaType) => {
      modals.openConfirmModal({
        title: t('deleteConfirmTitle'),
        children: <Text size="sm">{t('deleteConfirm')}</Text>,
        labels: { confirm: t('deleteTag'), cancel: t('editDrawer.cancel') },
        confirmProps: { color: 'red' },
        onConfirm: () => {
          if (isNew) {
            const current = (getValues('tags') ?? []) as RecursiveTagInput[];
            setValue('tags', removeTagFromTree(current, tag.id));
          } else {
            deleteTag.mutate({ tagId: tag.id, parentTagId: tag.parentTagId });
          }
        },
      });
    },
    [t, isNew, deleteTag, getValues, setValue]
  );

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.size === 0) return;

    modals.openConfirmModal({
      title: t('bulkDeleteConfirmTitle'),
      children: <Text size="sm">{t('bulkDeleteConfirm')}</Text>,
      labels: { confirm: t('bulkDelete'), cancel: t('editDrawer.cancel') },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        if (isNew) {
          const current = (getValues('tags') ?? []) as RecursiveTagInput[];
          setValue('tags', removeTagsFromTree(current, Array.from(selectedIds)));
          setSelectedIds(new Set());
        } else {
          bulkDeleteTags.mutate(Array.from(selectedIds), {
            onSuccess: () => setSelectedIds(new Set()),
          });
        }
      },
    });
  }, [selectedIds, t, isNew, bulkDeleteTags, getValues, setValue]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const columns = useMemo<ColDef<AdminTagChildrenPrismaType>[]>(
    () => [
      {
        colId: '__select__',
        headerName: '',
        width: 40,
        flex: 0,
        sortable: false,
        filter: false,
        resizable: false,
        suppressMovable: true,
        headerCheckboxSelection: false,
        cellRenderer: (
          props: ICellRendererParams<AdminTagChildrenPrismaType>
        ) => {
          const row = props.data;
          if (!row || (row as any).__isChild) return null;
          return (
            <input
              type="checkbox"
              checked={selectedIds.has(row.id)}
              onChange={() => toggleSelect(row.id)}
              onClick={(e) => e.stopPropagation()}
              style={{ cursor: 'pointer' }}
            />
          );
        },
      },
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
                    handleEditTag(row);
                  }}
                >
                  <Pencil size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={t('addChildTag')}>
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  color="teal"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    handleAddChildTag(row.id);
                  }}
                >
                  <Plus size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={t('deleteTag')}>
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  color="red"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    handleDeleteTag(row);
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
      handleEditTag,
      handleAddChildTag,
      handleDeleteTag,
      selectedIds,
      toggleSelect,
    ]
  );

  const expandableRow = useMemo<
    ExpandableRowConfig<AdminTagChildrenPrismaType>
  >(
    () => ({
      getRowId: (row) => row.id,
      isExpandable: (row) => row._count.children > 0,
      fullWidthCellRenderer: ({ data }) => (
        <TagChildrenPanel
          data={data}
          tagGroupId={tagGroupId}
          onEditTag={handleEditTag}
          onAddChildTag={handleAddChildTag}
          onDeleteTag={handleDeleteTag}
          maxDepth={MAX_DEPTH}
          currentDepth={1}
          isNew={isNew}
          formTags={isNew ? formTags ?? [] : undefined}
        />
      ),
      expandOnRowClick: true,
      singleExpand: false,
      detailHeight: 300,
      getDetailHeight: (row) =>
        Math.min(48 * (row._count.children + 1) + 100, 400),
    }),
    [
      tagGroupId,
      handleEditTag,
      handleAddChildTag,
      handleDeleteTag,
      isNew,
      formTags,
    ]
  );

  return (
    <>
      <FormCard
        title={t('title')}
        description={t('description')}
        icon={Tag}
        iconColor="violet"
      >
        <Stack gap="sm">
          <ExpandableDataTable<AdminTagChildrenPrismaType>
            columns={columns}
            rowData={rootTags}
            height="calc(100vh - 350px)"
            idPrefix="root-tags"
            expandableRow={expandableRow}
            loading={isLoading && !isNew}
            gridOptions={{ suppressCellFocus: true }}
          />
          <Group>
            <Button
              variant="light"
              leftSection={<Plus size={14} />}
              size="sm"
              onClick={handleAddRootTag}
            >
              {t('addRootTag')}
            </Button>
            {selectedIds.size > 0 && (
              <Button
                variant="light"
                color="red"
                leftSection={<Trash2 size={14} />}
                size="sm"
                onClick={handleBulkDelete}
                loading={!isNew && bulkDeleteTags.isPending}
              >
                {t('bulkDelete')} ({selectedIds.size})
              </Button>
            )}
          </Group>
        </Stack>
      </FormCard>

      <TagEditDrawer
        tag={editingTag}
        parentTagId={drawerParentTagId}
        tagGroupId={tagGroupId}
        opened={drawerOpened}
        onClose={() => setDrawerOpened(false)}
        isNew={isNew}
      />
    </>
  );
};
