'use client';

import { apiClient } from '@/core/lib/api/api-client';
import { downloadExport } from '@/core/lib/api/download';
import { Stack, Text, Title } from '@mantine/core';
import {
  buildColorMap,
  buildEnumOptions,
  WarehouseStatusConfigs,
} from '@org/constants/enum-configs';
import type { AdminWarehouseListPrismaType } from '@org/types/admin/warehouses';
import type { ExportFormat } from '@org/types/export';
import type { PaginatedResponse } from '@org/types/pagination';
import {
  AsyncMultiSelectFilter,
  DataTable,
  serializeGridQuery,
  useColumnFactory,
  type CopyColumn,
  type DataTableFilterTranslations,
  type DataTableTranslations,
} from '@org/ui';
import type { ColDef, IDatasource, IGetRowsParams } from 'ag-grid-community';
import { Warehouse } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useRef } from 'react';

export default function WarehousesPage() {
  const t = useTranslations('frontend.admin.warehouses');
  const tEnums = useTranslations('frontend.enums');
  const tExport = useTranslations('frontend.export');
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
        code: t('table.code'),
        name: t('table.name'),
        status: t('table.status'),
        location: t('table.location'),
        createdAt: t('table.createdAt'),
        store: t('table.store'),
      },
      contextMenu: {
        view: '',
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
        searchPlaceholder: t('filterDrawer.searchPlaceholder'),
        appliedFilters: t('filterDrawer.appliedFilters'),
      },
      columnVisibility: {
        title: tColumnVisibility('title'),
        showAll: tColumnVisibility('showAll'),
        hiddenCount: tColumnVisibility.raw('hiddenCount'),
      },
      noRows: {
        label: t('noRows.label'),
        icon: <Warehouse size={40} />,
      },
    }),
    [t, tColumnVisibility, filters]
  );

  const { createColumn } = useColumnFactory(translations);

  const columns = useMemo(
    () => [
      createColumn<AdminWarehouseListPrismaType>('code', {
        headerKey: 'code',
        type: 'text',
        minWidth: 120,
      }),
      createColumn<AdminWarehouseListPrismaType>('name', {
        headerKey: 'name',
        type: 'text',
        minWidth: 200,
        valueGetter: (params) => params.data?.translations?.[0]?.name ?? '',
        sortable: false,
      }),
      createColumn<AdminWarehouseListPrismaType>('status', {
        headerKey: 'status',
        type: 'badge',
        minWidth: 140,
        colorMap: buildColorMap(WarehouseStatusConfigs),
        enumOptions: buildEnumOptions(WarehouseStatusConfigs, tEnums),
      }),
      createColumn<AdminWarehouseListPrismaType>('location', {
        headerKey: 'location',
        type: 'text',
        minWidth: 250,
        valueGetter: (params) => {
          const d = params.data;
          if (!d) return '';
          return [
            d.city?.name,
            d.state?.name,
            d.country?.translations?.[0]?.name,
          ]
            .filter(Boolean)
            .join(', ');
        },
        sortable: false,
      }),
      {
        field: 'store.name',
        headerName: t('table.store'),
        minWidth: 140,
        sortable: false,
        filter: false,
        valueGetter: (params: { data?: AdminWarehouseListPrismaType }) =>
          params.data?.store?.name ?? '—',
      } as ColDef<AdminWarehouseListPrismaType>,
      createColumn<AdminWarehouseListPrismaType>(
        'storeId' as keyof AdminWarehouseListPrismaType & string,
        {
          headerKey: 'store',
          type: 'badge',
          hide: true,
          filter: {
            component: AsyncMultiSelectFilter,
            params: {
              fetchOptions: () =>
                apiClient
                  .get<Array<{ id: string; name: string }>>('/admin/stores')
                  .then((r) => r.data.map((s) => ({ value: s.id, label: s.name }))),
              placeholder: t('filterDrawer.storePlaceholder'),
            },
            doesFilterPass: () => true,
          },
        }
      ),
      createColumn<AdminWarehouseListPrismaType>('createdAt', {
        headerKey: 'createdAt',
        type: 'date',
        minWidth: 170,
      }),
    ],
    [createColumn, tEnums]
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
            PaginatedResponse<AdminWarehouseListPrismaType>
          >('/admin/warehouses/query', query);

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
        endpoint: '/admin/warehouses/export',
        format,
        columns: visibleColumns,
        headers: Object.keys(headerMap).length > 0 ? headerMap : undefined,
        filters: lastQueryRef.current.filters,
        sort: lastQueryRef.current.sort,
      });
    },
    [columns]
  );

  return (
    <Stack gap="md" className="flex-1">
      <div>
        <Title order={2}>{t('title')}</Title>
        <Text c="dimmed" mt="xs">
          {t('subtitle')}
        </Text>
      </div>

      <DataTable<AdminWarehouseListPrismaType>
        tableId="warehouses"
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
          onExportCSV: () => handleExport('csv'),
          onExportExcel: () => handleExport('xlsx'),
          showView: false,
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
