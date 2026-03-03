'use client';

import { apiClient } from '@/core/lib/api/api-client';
import { downloadExport } from '@/core/lib/api/download';
import { Stack, Text, Title } from '@mantine/core';
import {
  AccountStatusConfigs,
  UserRoleConfigs,
  buildColorMap,
  buildEnumOptions,
} from '@org/constants/enum-configs';
import type { AdminCustomersPrismaType } from '@org/types/admin/customers';
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
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useRef } from 'react';

export default function CustomersPage() {
  const t = useTranslations('common.admin.customers');
  const router = useRouter();

  const tEnums = useTranslations('common.enums');
  const tExport = useTranslations('common.export');
  const tFilters = useTranslations('common.dataTable.filters');

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
        surname: t('table.surname'),
        email: t('table.email'),
        phone: t('table.phone'),
        role: t('table.role'),
        status: t('table.status'),
        emailVerified: t('table.emailVerified'),
        phoneVerified: t('table.phoneVerified'),
        twoFactorEnabled: t('table.twoFactorEnabled'),
        lastLoginAt: t('table.lastLoginAt'),
        loginCount: t('table.loginCount'),
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
    }),
    [t]
  );

  const { createColumn } = useColumnFactory(translations);

  const columns = useMemo(
    () => [
      createColumn<AdminCustomersPrismaType>('name', {
        headerKey: 'name',
        type: 'text',
        minWidth: 130,
      }),
      createColumn<AdminCustomersPrismaType>('surname', {
        headerKey: 'surname',
        type: 'text',
        minWidth: 130,
      }),
      createColumn<AdminCustomersPrismaType>('email', {
        headerKey: 'email',
        type: 'text',
        minWidth: 200,
      }),
      createColumn<AdminCustomersPrismaType>('phone', {
        headerKey: 'phone',
        type: 'text',
        minWidth: 150,
      }),
      createColumn<AdminCustomersPrismaType>('role', {
        headerKey: 'role',
        type: 'badge',
        minWidth: 120,
        colorMap: buildColorMap(UserRoleConfigs),
        enumOptions: buildEnumOptions(UserRoleConfigs, tEnums),
      }),
      createColumn<AdminCustomersPrismaType>('status', {
        headerKey: 'status',
        type: 'badge',
        minWidth: 120,
        colorMap: buildColorMap(AccountStatusConfigs),
        enumOptions: buildEnumOptions(AccountStatusConfigs, tEnums),
      }),
      createColumn<AdminCustomersPrismaType>('emailVerified', {
        headerKey: 'emailVerified',
        type: 'boolean',
      }),
      createColumn<AdminCustomersPrismaType>('twoFactorEnabled', {
        headerKey: 'twoFactorEnabled',
        type: 'boolean',
      }),
      createColumn<AdminCustomersPrismaType>('lastLoginAt', {
        headerKey: 'lastLoginAt',
        type: 'datetime',
        minWidth: 170,
      }),
      createColumn<AdminCustomersPrismaType>('loginCount', {
        headerKey: 'loginCount',
        type: 'number',
        minWidth: 110,
      }),
      createColumn<AdminCustomersPrismaType>('createdAt', {
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
        .filter((c) => c.field)
        .map((c) => ({
          field: c.field as string,
          headerName: (c.headerName as string) ?? (c.field as string),
        })),
    [columns]
  );

  const copyFormatters = useMemo<Record<string, (value: unknown) => string>>(
    () => ({
      emailVerified: (v) =>
        v ? tExport('boolean_yes') : tExport('boolean_no'),
      phoneVerified: (v) =>
        v ? tExport('boolean_yes') : tExport('boolean_no'),
      twoFactorEnabled: (v) =>
        v ? tExport('boolean_yes') : tExport('boolean_no'),
      lastLoginAt: (v) => (v ? new Date(v as string).toLocaleString() : '—'),
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
            PaginatedResponse<AdminCustomersPrismaType>
          >('/admin/customers/query', query);

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
        .map((c) => c.field as string | undefined)
        .filter(Boolean) as string[];

      const headerMap: Record<string, string> = {};
      for (const col of columns) {
        if (col.field && col.headerName) {
          headerMap[col.field as string] = col.headerName;
        }
      }

      downloadExport({
        endpoint: '/admin/customers/export',
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
    (row: AdminCustomersPrismaType) => {
      router.push(`/admin/customers/${row.id}`);
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

      <DataTable<AdminCustomersPrismaType>
        columns={columns}
        datasource={datasource}
        translations={translations}
        height="calc(100vh - 180px)"
        gridOptions={{
          cellSelection: false,
          suppressCellFocus: true,
          suppressRowClickSelection: true,
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
