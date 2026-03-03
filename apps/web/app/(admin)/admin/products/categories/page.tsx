'use client';

import { apiClient } from '@/core/lib/api/api-client';
import { downloadExport } from '@/core/lib/api/download';
import { Stack, Text, Title } from '@mantine/core';
import type { AdminCategoryListPrismaType } from '@org/types/admin/categories';
import type { ExportFormat } from '@org/types/export';
import type { PaginatedResponse } from '@org/types/pagination';
import {
  DataTable,
  serializeGridQuery,
  useColumnFactory,
  type CopyColumn,
  type DataTableFilterTranslations,
  type DataTableTranslations,
} from '@org/ui';
import type { IDatasource, IGetRowsParams } from 'ag-grid-community';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useRef } from 'react';

export default function CategoriesPage() {
  const t = useTranslations('common.admin.categories');
  const router = useRouter();
  const locale = useLocale();
  const tExport = useTranslations('common.export');
  const tFilters = useTranslations('common.dataTable.filters');
  const tColumnVisibility = useTranslations(
    'common.dataTable.columnVisibility'
  );

  const filters = useMemo<DataTableFilterTranslations>(
    () => ({
      reset: tFilters('reset'),
      text: { placeholder: tFilters('text.placeholder') },
      date: {
        placeholder: tFilters('date.placeholder'),
        placeholderTo: tFilters('date.placeholderTo'),
        equals: tFilters('date.equals'),
        greaterThan: tFilters('date.greaterThan'),
        lessThan: tFilters('date.lessThan'),
        inRange: tFilters('date.inRange'),
      },
      boolean: {
        placeholder: tFilters('boolean.placeholder'),
        yes: tFilters('boolean.yes'),
        no: tFilters('boolean.no'),
      },
      number: {
        placeholder: tFilters('number.placeholder'),
        placeholderTo: tFilters('number.placeholderTo'),
        equals: tFilters('number.equals'),
        greaterThan: tFilters('number.greaterThan'),
        lessThan: tFilters('number.lessThan'),
        inRange: tFilters('number.inRange'),
      },
      locale: {
        placeholder: tFilters('locale.placeholder'),
        labels: {
          en: tFilters('locale.labels.en'),
          tr: tFilters('locale.labels.tr'),
          de: tFilters('locale.labels.de'),
          fr: tFilters('locale.labels.fr'),
          es: tFilters('locale.labels.es'),
          it: tFilters('locale.labels.it'),
          nl: tFilters('locale.labels.nl'),
        },
      },
    }),
    [tFilters]
  );

  const translations = useMemo<DataTableTranslations>(
    () => ({
      filters,
      columns: {
        name: t('table.name'),
        parentName: t('table.parentName'),
        depth: t('table.depth'),
        isActive: t('table.isActive'),
        childrenCount: t('table.childrenCount'),
        productsCount: t('table.productsCount'),
        createdAt: t('table.createdAt'),
      },
      contextMenu: {
        view: t('contextMenu.view'),
        copy: t('contextMenu.copy'),
        copySelected: t('contextMenu.copySelected'),
        copyAsTable: t('contextMenu.copyAsTable'),
        copyAsJSON: t('contextMenu.copyAsJSON'),
        copyAsPlainText: t('contextMenu.copyAsPlainText'),
        exportGroup: t('contextMenu.exportGroup'),
        exportCSV: t('contextMenu.exportCSV'),
        exportExcel: t('contextMenu.exportExcel'),
      },
      footer: {
        totalRows: t.raw('footer.totalRows'),
        selectedRows: t.raw('footer.selectedRows'),
        refresh: t('footer.refresh'),
      },
      filterDrawer: {
        title: t('filterDrawer.title'),
        clearAll: t('filterDrawer.clearAll'),
        activeFilters: t.raw('filterDrawer.activeFilters'),
        noFilters: t('filterDrawer.noFilters'),
        apply: t('filterDrawer.apply'),
      },
      columnVisibility: {
        title: tColumnVisibility('title'),
        showAll: tColumnVisibility('showAll'),
        hiddenCount: tColumnVisibility.raw('hiddenCount'),
      },
    }),
    [t, tColumnVisibility, filters]
  );

  const { createColumn } = useColumnFactory(translations);

  const columns = useMemo(
    () => [
      createColumn<AdminCategoryListPrismaType>('name', {
        headerKey: 'name',
        type: 'text',
        minWidth: 200,
        valueGetter: (params) => {
          if (!params.data?.translations?.length) return '';
          const match = params.data.translations.find(
            (tr) => tr.locale.toLowerCase() === locale.toLowerCase()
          );
          return match?.name ?? params.data.translations[0]?.name ?? '';
        },
        sortable: false,
      }),
      createColumn<AdminCategoryListPrismaType>(
        'parentName' as keyof AdminCategoryListPrismaType & string,
        {
          headerKey: 'parentName',
          type: 'text',
          minWidth: 180,
          valueGetter: (params) => {
            const parent = params.data?.parent;
            if (!parent?.translations?.length) return '—';
            const match = parent.translations.find(
              (tr) => tr.locale.toLowerCase() === locale.toLowerCase()
            );
            return match?.name ?? parent.translations[0]?.name ?? '—';
          },
          sortable: false,
          filter: false,
        }
      ),
      createColumn<AdminCategoryListPrismaType>('depth', {
        headerKey: 'depth',
        type: 'number',
        minWidth: 80,
      }),
      createColumn<AdminCategoryListPrismaType>('isActive', {
        headerKey: 'isActive',
        type: 'boolean',
      }),
      createColumn<AdminCategoryListPrismaType>('_count.children', {
        headerKey: 'childrenCount',
        type: 'number',
        minWidth: 110,
      }),
      createColumn<AdminCategoryListPrismaType>('_count.products', {
        headerKey: 'productsCount',
        type: 'number',
        minWidth: 110,
      }),
      createColumn<AdminCategoryListPrismaType>('createdAt', {
        headerKey: 'createdAt',
        type: 'date',
        minWidth: 170,
      }),
    ],
    [createColumn, locale]
  );

  const copyColumns = useMemo<CopyColumn[]>(
    () =>
      columns
        .filter((c) => c.field || c.colId)
        .map((c) => ({
          field: ((c.field ?? c.colId) as string) || '',
          headerName:
            (c.headerName as string) ?? ((c.field ?? c.colId) as string) ?? '',
        })),
    [columns]
  );

  const copyFormatters = useMemo<Record<string, (value: unknown) => string>>(
    () => ({
      isActive: (v) => (v ? tExport('boolean_yes') : tExport('boolean_no')),
      createdAt: (v) => (v ? new Date(v as string).toLocaleString() : '—'),
    }),
    [tExport]
  );

  const lastQueryRef = useRef<{ filters?: string; sort?: string }>({});

  const datasource = useMemo<IDatasource>(
    () => ({
      getRows: async (params: IGetRowsParams) => {
        try {
          const query = serializeGridQuery({
            startRow: params.startRow,
            endRow: params.endRow,
            filterModel: params.filterModel,
            sortModel: params.sortModel,
          });

          lastQueryRef.current = {
            filters: query.filters ? JSON.stringify(query.filters) : undefined,
            sort: query.sort ? JSON.stringify(query.sort) : undefined,
          };

          const res = await apiClient.post<
            PaginatedResponse<AdminCategoryListPrismaType>
          >('/admin/categories/query', query);

          params.successCallback(res.data.data, res.data.pagination.total);
        } catch {
          params.failCallback();
        }
      },
    }),
    [columns]
  );

  const handleExport = useCallback(
    (format: ExportFormat) => {
      const visibleColumns = columns
        .map((c) => (c.field ?? c.colId) as string | undefined)
        .filter(Boolean) as string[];

      const headerMap: Record<string, string> = {};
      for (const col of columns) {
        const key = (col.field ?? col.colId) as string | undefined;
        if (key && col.headerName) {
          headerMap[key] = col.headerName;
        }
      }

      downloadExport({
        endpoint: '/admin/categories/export',
        format,
        columns: visibleColumns,
        headers: Object.keys(headerMap).length > 0 ? headerMap : undefined,
        filters: lastQueryRef.current.filters,
        sort: lastQueryRef.current.sort,
      });
    },
    [columns]
  );

  const handleViewDetails = useCallback(
    (row: AdminCategoryListPrismaType) => {
      router.push(`/admin/products/categories/${row.id}`);
    },
    [router]
  );

  return (
    <Stack gap="md" className="flex-1">
      <div>
        <Title order={2}>{t('title')}</Title>
        <Text c="dimmed" mt="xs">
          {t('subtitle')}
        </Text>
      </div>

      <DataTable<AdminCategoryListPrismaType>
        tableId="categories"
        columns={columns}
        datasource={datasource}
        translations={translations}
        height="calc(100vh - 180px)"
        gridOptions={{
          cellSelection: false,
          suppressCellFocus: true,
          rowSelection: {
            enableClickSelection: false,
            mode: 'multiRow',
          },
        }}
        showFilterDrawer
        contextMenu={{
          enabled: true,
          onView: handleViewDetails,
          onExportCSV: () => handleExport('csv'),
          onExportExcel: () => handleExport('xlsx'),
          showView: true,
          showCopy: true,
          showExportCSV: true,
          showExportExcel: true,
          copyColumns,
          copyFormatters,
        }}
      />
    </Stack>
  );
}
