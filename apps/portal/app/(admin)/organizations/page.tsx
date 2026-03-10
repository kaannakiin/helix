'use client';

import { apiClient } from '@/core/lib/api/api-client';
import { downloadExport } from '@/core/lib/api/download';
import { Stack, Text, Title } from '@mantine/core';
import type { AdminOrganizationsPrismaType } from '@org/types/admin/organizations';
import type { ExportFormat } from '@org/types/export';
import type { PaginatedResponse } from '@org/types/pagination';
import {
  DataTable,
  SearchInput,
  serializeGridQuery,
  useColumnFactory,
  useTableSearch,
  type CopyColumn,
  type DataTableFilterTranslations,
  type DataTableTranslations,
} from '@org/ui';
import type { ColDef, IDatasource, IGetRowsParams } from 'ag-grid-community';
import { Building2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useRef } from 'react';

export default function OrganizationsPage() {
  const t = useTranslations('frontend.admin.organizations');
  const router = useRouter();

  const tExport = useTranslations('frontend.export');
  const tFilters = useTranslations('frontend.dataTable.filters');
  const tColumnVisibility = useTranslations(
    'frontend.dataTable.columnVisibility'
  );

  const filters = useMemo<DataTableFilterTranslations>(
    () => ({
      reset: tFilters('reset'),
      text: {
        placeholder: tFilters('text.placeholder'),
      },
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
        taxId: t('table.taxId'),
        email: t('table.email'),
        phone: t('table.phone'),
        isActive: t('table.isActive'),
        membersCount: t('table.membersCount'),
        childOrgsCount: t('table.childOrgsCount'),
        parentOrg: t('table.parentOrg'),
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
        searchPlaceholder: t('filterDrawer.searchPlaceholder'),
        appliedFilters: t('filterDrawer.appliedFilters'),
      },
      noRows: {
        label: t('noRows.label'),
        icon: <Building2 size={40} />,
      },
      columnVisibility: {
        title: tColumnVisibility('title'),
        showAll: tColumnVisibility('showAll'),
        hiddenCount: tColumnVisibility.raw('hiddenCount'),
      },
    }),
    [t, tColumnVisibility]
  );

  const { createColumn } = useColumnFactory(translations);

  const columns = useMemo(
    () => [
      createColumn<AdminOrganizationsPrismaType>('name', {
        headerKey: 'name',
        type: 'text',
        minWidth: 180,
      }),
      createColumn<AdminOrganizationsPrismaType>('taxId', {
        headerKey: 'taxId',
        type: 'text',
        minWidth: 130,
      }),
      createColumn<AdminOrganizationsPrismaType>('email', {
        headerKey: 'email',
        type: 'text',
        minWidth: 200,
      }),
      createColumn<AdminOrganizationsPrismaType>('phone', {
        headerKey: 'phone',
        type: 'text',
        minWidth: 150,
      }),
      createColumn<AdminOrganizationsPrismaType>('isActive', {
        headerKey: 'isActive',
        type: 'boolean',
      }),
      {
        field: '_count.members',
        headerName: t('table.membersCount'),
        minWidth: 100,
        sortable: false,
        filter: false,
        valueGetter: (params: { data?: AdminOrganizationsPrismaType }) =>
          params.data?._count?.members ?? '',
      } as ColDef<AdminOrganizationsPrismaType>,
      {
        field: '_count.childOrgs',
        headerName: t('table.childOrgsCount'),
        minWidth: 100,
        sortable: false,
        filter: false,
        valueGetter: (params: { data?: AdminOrganizationsPrismaType }) =>
          params.data?._count?.childOrgs ?? '',
      } as ColDef<AdminOrganizationsPrismaType>,
      {
        field: 'parentOrg',
        headerName: t('table.parentOrg'),
        minWidth: 150,
        sortable: false,
        filter: false,
        valueGetter: (params: { data?: AdminOrganizationsPrismaType }) =>
          params.data?.parentOrg?.name ?? '—',
      } as ColDef<AdminOrganizationsPrismaType>,
      createColumn<AdminOrganizationsPrismaType>('createdAt', {
        headerKey: 'createdAt',
        type: 'date',
        minWidth: 170,
      }),
    ],
    [createColumn, t]
  );

  const copyColumns = useMemo<CopyColumn[]>(
    () =>
      columns
        .filter((c) => c.field)
        .map((c) => ({
          field: c.field as string,
          headerName: (c.headerName as string) ?? (c.field as string),
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

  const { search, setSearch, searchParam } =
    useTableSearch<AdminOrganizationsPrismaType>({
      fields: ['name', 'email', 'taxId'],
      searchParam: 'q',
    });

  const datasource = useMemo<IDatasource>(
    () => ({
      getRows: async (params: IGetRowsParams) => {
        try {
          const query = serializeGridQuery({
            startRow: params.startRow,
            endRow: params.endRow,
            filterModel: params.filterModel,
            sortModel: params.sortModel,
            search: searchParam,
          });

          lastQueryRef.current = {
            filters: query.filters ? JSON.stringify(query.filters) : undefined,
            sort: query.sort ? JSON.stringify(query.sort) : undefined,
          };

          const res = await apiClient.post<
            PaginatedResponse<AdminOrganizationsPrismaType>
          >('/admin/organizations/query', query);

          params.successCallback(res.data.data, res.data.pagination.total);
        } catch {
          params.failCallback();
        }
      },
    }),
    [searchParam]
  );

  const handleExport = useCallback(
    (format: ExportFormat) => {
      const visibleColumns = columns
        .map((c) => c.field as string | undefined)
        .filter(Boolean) as string[];

      const headerMap: Record<string, string> = {};
      for (const col of columns) {
        if (col.field && col.headerName) {
          headerMap[col.field as string] = col.headerName;
        }
      }

      downloadExport({
        endpoint: '/admin/organizations/export',
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
    (row: AdminOrganizationsPrismaType) => {
      router.push(`/organizations/${row.id}`);
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

      <SearchInput
        placeholder={t('searchPlaceholder')}
        value={search}
        onChange={setSearch}
        style={{ width: 320 }}
      />

      <DataTable<AdminOrganizationsPrismaType>
        tableId="organizations"
        columns={columns}
        datasource={datasource}
        translations={translations}
        height="calc(100vh - 180px)"
        gridOptions={{
          cellSelection: false,
          suppressCellFocus: true,
          rowSelection: {
            mode: 'multiRow',
            enableClickSelection: true,
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
