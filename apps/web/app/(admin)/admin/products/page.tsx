'use client';

import { apiClient } from '@/core/lib/api/api-client';
import { downloadExport } from '@/core/lib/api/download';
import { Button, Group, Stack, Text, Title } from '@mantine/core';
import {
  ProductStatusConfigs,
  ProductTypeConfigs,
  buildColorMap,
  buildEnumOptions,
} from '@org/constants/enum-configs';
import type { AdminProductListPrismaType } from '@org/types/admin/products';
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
import { Plus } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useRef } from 'react';

export default function ProductsPage() {
  const t = useTranslations('frontend.admin.products');
  const router = useRouter();
  const locale = useLocale();
  const tEnums = useTranslations('frontend.enums');
  const tFilters = useTranslations('frontend.dataTable.filters');
  const tColumnVisibility = useTranslations(
    'frontend.dataTable.columnVisibility'
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
        type: t('table.type'),
        status: t('table.status'),
        brandName: t('table.brandName'),
        variantCount: t('table.variantCount'),
        categoryCount: t('table.categoryCount'),
        tagCount: t('table.tagCount'),
        createdAt: t('table.createdAt'),
        updatedAt: t('table.updatedAt'),
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

  const { createColumn } = useColumnFactory(translations, { locale });

  const columns = useMemo(
    () => [
      createColumn<AdminProductListPrismaType>('name', {
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
      createColumn<AdminProductListPrismaType>('type', {
        headerKey: 'type',
        type: 'badge',
        minWidth: 120,
        colorMap: buildColorMap(ProductTypeConfigs),
        enumOptions: buildEnumOptions(ProductTypeConfigs, tEnums),
      }),
      createColumn<AdminProductListPrismaType>('status', {
        headerKey: 'status',
        type: 'badge',
        minWidth: 120,
        colorMap: buildColorMap(ProductStatusConfigs),
        enumOptions: buildEnumOptions(ProductStatusConfigs, tEnums),
      }),
      createColumn<AdminProductListPrismaType>(
        'brandName' as keyof AdminProductListPrismaType & string,
        {
          headerKey: 'brandName',
          type: 'text',
          minWidth: 150,
          valueGetter: (params) => {
            const brand = params.data?.brand;
            if (!brand?.translations?.length) return '—';
            const match = brand.translations.find(
              (tr) => tr.locale.toLowerCase() === locale.toLowerCase()
            );
            return match?.name ?? brand.translations[0]?.name ?? '—';
          },
          sortable: false,
          filter: false,
        }
      ),
      createColumn<AdminProductListPrismaType>('_count.variants', {
        headerKey: 'variantCount',
        type: 'number',
        minWidth: 110,
      }),
      createColumn<AdminProductListPrismaType>('_count.categories', {
        headerKey: 'categoryCount',
        type: 'number',
        minWidth: 110,
      }),
      createColumn<AdminProductListPrismaType>('_count.tags', {
        headerKey: 'tagCount',
        type: 'number',
        minWidth: 110,
      }),
      createColumn<AdminProductListPrismaType>('createdAt', {
        headerKey: 'createdAt',
        type: 'date',
        minWidth: 170,
      }),
      createColumn<AdminProductListPrismaType>('updatedAt', {
        headerKey: 'updatedAt',
        type: 'datetime',
        dateStyle: 'relative',
        minWidth: 170,
      }),
    ],
    [createColumn, locale, tEnums]
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
      createdAt: (v) => (v ? new Date(v as string).toLocaleString() : '—'),
      updatedAt: (v) => (v ? new Date(v as string).toLocaleString() : '—'),
    }),
    []
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
            PaginatedResponse<AdminProductListPrismaType>
          >('/admin/products/query', query);

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
        endpoint: '/admin/products/export',
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
    (row: AdminProductListPrismaType) => {
      router.push(`/admin/products/${row.id}`);
    },
    [router]
  );

  return (
    <Stack gap="md" className="flex-1">
      <Group justify="space-between" align="center">
        <div>
          <Title order={2}>{t('title')}</Title>
          <Text c="dimmed" mt="xs">
            {t('subtitle')}
          </Text>
        </div>
        <Button
          leftSection={<Plus size={16} />}
          onClick={() => router.push('/admin/products/new')}
        >
          {t('new')}
        </Button>
      </Group>

      <DataTable<AdminProductListPrismaType>
        tableId="products"
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
