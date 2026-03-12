'use client';

import { apiClient } from '@/core/lib/api/api-client';
import { Button, Group, MultiSelect, Stack, Text, Title } from '@mantine/core';
import {
  CustomerGroupTypeConfigs,
  buildColorMap,
  buildEnumOptions,
} from '@org/constants/enum-configs';
import type { AdminCustomerGroupListPrismaType } from '@org/types/admin/customer-groups';
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
import type { AgGridEvent, ColDef, IDatasource, IGetRowsParams } from 'ag-grid-community';
import { Plus, UsersRound } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useRef, useState } from 'react';

export default function AdminCustomerGroupsPage() {
  const t = useTranslations('frontend.admin.customerGroups');
  const tEnums = useTranslations('frontend.enums');
  const router = useRouter();
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
        isActive: t('table.isActive'),
        membersCount: t('table.membersCount'),
        lastEvaluatedAt: t('table.lastEvaluatedAt'),
        createdAt: t('table.createdAt'),
        store: t('table.store'),
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
        icon: <UsersRound size={40} />,
      },
    }),
    [t, tColumnVisibility, filters]
  );

  const { createColumn } = useColumnFactory(translations);

  const columns = useMemo(
    () => [
      createColumn<AdminCustomerGroupListPrismaType>('name', {
        headerKey: 'name',
        type: 'text',
        minWidth: 200,
      }),
      createColumn<AdminCustomerGroupListPrismaType>('type', {
        headerKey: 'type',
        type: 'badge',
        minWidth: 130,
        colorMap: buildColorMap(CustomerGroupTypeConfigs),
        enumOptions: buildEnumOptions(CustomerGroupTypeConfigs, tEnums),
      }),
      createColumn<AdminCustomerGroupListPrismaType>('isActive', {
        headerKey: 'isActive',
        type: 'boolean',
      }),
      createColumn<AdminCustomerGroupListPrismaType>('_count.members', {
        headerKey: 'membersCount',
        type: 'number',
        minWidth: 110,
      }),
      createColumn<AdminCustomerGroupListPrismaType>('lastEvaluatedAt', {
        headerKey: 'lastEvaluatedAt',
        type: 'datetime',
        minWidth: 170,
      }),
      {
        field: 'store.name',
        headerName: t('table.store'),
        minWidth: 140,
        sortable: false,
        filter: false,
        valueGetter: (params: { data?: AdminCustomerGroupListPrismaType }) =>
          params.data?.store?.name ?? '—',
      } as ColDef<AdminCustomerGroupListPrismaType>,
      createColumn<AdminCustomerGroupListPrismaType>(
        'storeId' as keyof AdminCustomerGroupListPrismaType & string,
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
                  .then((r) =>
                    r.data.map((s) => ({ value: s.id, label: s.name }))
                  ),
              placeholder: t('filterDrawer.storePlaceholder'),
            },
            doesFilterPass: () => true,
          },
        }
      ),
      createColumn<AdminCustomerGroupListPrismaType>('createdAt', {
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
      lastEvaluatedAt: (v) =>
        v ? new Date(v as string).toLocaleString() : '—',
      createdAt: (v) => (v ? new Date(v as string).toLocaleDateString() : '—'),
    }),
    []
  );

  const lastQueryRef = useRef<{ filters?: string; sort?: string }>({});
  const gridRef = useRef<{ api?: AgGridEvent['api'] }>({});
  const [selectedStores, setSelectedStores] = useState<string[]>([]);

  const { data: storeOptions } = useQuery({
    queryKey: ['admin', 'stores', 'options'],
    queryFn: () =>
      apiClient
        .get<Array<{ id: string; name: string }>>('/admin/stores')
        .then((r) => r.data.map((s) => ({ value: s.id, label: s.name }))),
    staleTime: 5 * 60 * 1000,
  });

  const handleStoreFilter = useCallback((values: string[]) => {
    setSelectedStores(values);
    const api = gridRef.current.api;
    if (!api) return;
    const current = api.getFilterModel() ?? {};
    if (values.length === 0) {
      const { storeId: _, ...rest } = current;
      api.setFilterModel(rest);
    } else {
      api.setFilterModel({
        ...current,
        storeId: { filterType: 'custom', values },
      });
    }
  }, []);

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
            PaginatedResponse<AdminCustomerGroupListPrismaType>
          >('/admin/customer-groups/query', query);

          params.successCallback(res.data.data, res.data.pagination.total);
        } catch {
          params.failCallback();
        }
      },
    }),
    [columns]
  );

  const handleViewDetails = useCallback(
    (row: AdminCustomerGroupListPrismaType) => {
      router.push(`/customers/customer-groups/${row.id}`);
    },
    [router]
  );

  return (
    <Stack gap="md" className="flex-1">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>{t('title')}</Title>
          <Text c="dimmed" mt="xs">
            {t('subtitle')}
          </Text>
        </div>
        <MultiSelect
          data={storeOptions ?? []}
          value={selectedStores}
          onChange={handleStoreFilter}
          placeholder={t('filterDrawer.storePlaceholder')}
          clearable
          searchable
          style={{ width: 240 }}
        />
        <Button
          leftSection={<Plus size={16} />}
          onClick={() => router.push('/customers/customer-groups/new')}
        >
          {t('new')}
        </Button>
      </Group>

      <DataTable<AdminCustomerGroupListPrismaType>
        tableId="customerGroups"
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
          onGridReady: (event) => {
            gridRef.current.api = event.api;
          },
        }}
        showFilterDrawer
        contextMenu={{
          enabled: true,
          onView: handleViewDetails,
          showView: true,
          showCopy: true,
          showExportCSV: false,
          showExportExcel: false,
          copyColumns,
          copyFormatters,
        }}
      />
    </Stack>
  );
}
