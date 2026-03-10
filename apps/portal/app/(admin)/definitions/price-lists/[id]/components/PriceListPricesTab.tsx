'use client';

import { apiClient } from '@/core/lib/api/api-client';
import { Button, Group, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  CurrencyCodeConfigs,
  PriceOriginTypeConfigs,
  buildColorMap,
  buildEnumOptions,
} from '@org/constants/enum-configs';
import type { AdminPriceListPriceListPrismaType } from '@org/types/admin/pricing';
import type { PaginatedResponse } from '@org/types/pagination';
import {
  DataTable,
  SearchInput,
  serializeGridQuery,
  useColumnFactory,
  useTableSearch,
  type DataTableFilterTranslations,
  type DataTableTranslations,
} from '@org/ui';
import type {
  AgGridEvent,
  IDatasource,
  IGetRowsParams,
} from 'ag-grid-community';
import { DollarSign, Plus } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useMemo, useRef, useState } from 'react';
import { AddVariantsToPriceListDrawer } from './AddVariantsToPriceListDrawer';
import { EditPriceRowDrawer } from './EditPriceRowDrawer';
import { PricesSummaryCards } from './PricesSummaryCards';

interface PriceListPricesTabProps {
  priceListId: string;
  defaultCurrencyCode: string;
}

export function PriceListPricesTab({
  priceListId,
  defaultCurrencyCode,
}: PriceListPricesTabProps) {
  const t = useTranslations('frontend.admin.priceLists.form.prices');
  const tFilters = useTranslations('frontend.dataTable.filters');
  const tColumnVisibility = useTranslations(
    'frontend.dataTable.columnVisibility'
  );
  const tEnums = useTranslations('frontend.enums');
  const locale = useLocale();

  const gridRef = useRef<{ api?: AgGridEvent['api'] }>({});
  const [editRow, setEditRow] =
    useState<AdminPriceListPriceListPrismaType | null>(null);
  const [addOpened, { open: openAdd, close: closeAdd }] = useDisclosure(false);

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
        variantName: t('table.variantName'),
        sku: t('table.sku'),
        currency: t('table.currency'),
        originType: t('table.originType'),
        price: t('table.price'),
        compareAt: t('table.compareAt'),
        minQty: t('table.minQty'),
        maxQty: t('table.maxQty'),
        uom: t('table.uom'),
        validity: t('table.validity'),
        locked: t('table.locked'),
        updatedAt: t('table.updatedAt'),
      },
      contextMenu: {
        view: t('contextMenu.edit'),
        copy: t('contextMenu.edit'),
        copySelected: '',
        copyAsTable: '',
        copyAsJSON: '',
        copyAsPlainText: '',
        exportGroup: '',
        exportCSV: '',
        exportExcel: '',
      },
      footer: {
        totalRows: t.raw('footer.totalRows'),
        selectedRows: t.raw('footer.selectedRows'),
        refresh: t('footer.refresh'),
      },
      filterDrawer: {
        title: t('title'),
        clearAll: tFilters('reset'),
        activeFilters: '({count})',
        noFilters: '',
        apply: '',
        searchPlaceholder: '',
        appliedFilters: '',
      },
      columnVisibility: {
        title: tColumnVisibility('title'),
        showAll: tColumnVisibility('showAll'),
        hiddenCount: tColumnVisibility.raw('hiddenCount'),
      },
      noRows: {
        label: t('noRows.label'),
        icon: <DollarSign size={40} />,
      },
    }),
    [t, tColumnVisibility, filters]
  );

  const { createColumn } = useColumnFactory(translations, { locale });

  const columns = useMemo(
    () => [
      createColumn<AdminPriceListPriceListPrismaType>(
        'variantName' as keyof AdminPriceListPriceListPrismaType & string,
        {
          headerKey: 'variantName',
          type: 'text',
          minWidth: 200,
          valueGetter: (params) =>
            params.data?.productVariant?.product?.translations?.[0]?.name ??
            '—',
          sortable: false,
          filter: false,
        }
      ),
      createColumn<AdminPriceListPriceListPrismaType>(
        'productVariant.sku' as keyof AdminPriceListPriceListPrismaType &
          string,
        {
          headerKey: 'sku',
          type: 'text',
          minWidth: 130,
          valueGetter: (params) => params.data?.productVariant?.sku ?? '—',
        }
      ),
      createColumn<AdminPriceListPriceListPrismaType>('currencyCode', {
        headerKey: 'currency',
        type: 'badge',
        minWidth: 100,
        enumOptions: buildEnumOptions(CurrencyCodeConfigs, tEnums),
      }),
      createColumn<AdminPriceListPriceListPrismaType>('originType', {
        headerKey: 'originType',
        type: 'badge',
        minWidth: 110,
        colorMap: buildColorMap(PriceOriginTypeConfigs),
        enumOptions: buildEnumOptions(PriceOriginTypeConfigs, tEnums),
      }),
      createColumn<AdminPriceListPriceListPrismaType>('price', {
        headerKey: 'price',
        type: 'number',
        minWidth: 110,
        valueFormatter: (params) => {
          const val = params.value;
          if (val == null) return '—';
          return Number(val).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 4,
          });
        },
      }),
      createColumn<AdminPriceListPriceListPrismaType>('compareAtPrice', {
        headerKey: 'compareAt',
        type: 'number',
        minWidth: 110,
        filter: false,
        valueFormatter: (params) => {
          const val = params.value;
          if (val == null) return '—';
          return Number(val).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 4,
          });
        },
      }),
      createColumn<AdminPriceListPriceListPrismaType>('minQuantity', {
        headerKey: 'minQty',
        type: 'number',
        minWidth: 90,
      }),
      createColumn<AdminPriceListPriceListPrismaType>('maxQuantity', {
        headerKey: 'maxQty',
        type: 'number',
        minWidth: 90,
        filter: false,
      }),
      createColumn<AdminPriceListPriceListPrismaType>(
        'uom' as keyof AdminPriceListPriceListPrismaType & string,
        {
          headerKey: 'uom',
          type: 'text',
          minWidth: 80,
          valueGetter: (params) => params.data?.unitOfMeasure?.code ?? '—',
          sortable: false,
          filter: false,
        }
      ),
      createColumn<AdminPriceListPriceListPrismaType>(
        'validity' as keyof AdminPriceListPriceListPrismaType & string,
        {
          headerKey: 'validity',
          type: 'text',
          minWidth: 180,
          valueGetter: (params) => {
            const from = params.data?.validFrom;
            const to = params.data?.validTo;
            if (!from && !to) return '—';
            const fStr = from ? new Date(from).toLocaleDateString() : '...';
            const tStr = to ? new Date(to).toLocaleDateString() : '...';
            return `${fStr} → ${tStr}`;
          },
          sortable: false,
          filter: false,
        }
      ),
      createColumn<AdminPriceListPriceListPrismaType>('isSourceLocked', {
        headerKey: 'locked',
        type: 'boolean',
        minWidth: 90,
      }),
      createColumn<AdminPriceListPriceListPrismaType>('updatedAt', {
        headerKey: 'updatedAt',
        type: 'datetime',
        dateStyle: 'relative',
        minWidth: 140,
      }),
    ],
    [createColumn, tEnums]
  );

  const { search, setSearch, searchParam } = useTableSearch({
    fields: ['productVariant.sku', '_product.translations.name'],
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

          const res = await apiClient.post<
            PaginatedResponse<AdminPriceListPriceListPrismaType>
          >(`/admin/price-lists/${priceListId}/prices/query`, query);

          params.successCallback(res.data.data, res.data.pagination.total);
        } catch {
          params.failCallback();
        }
      },
    }),
    [searchParam, priceListId]
  );

  const handleEdit = useCallback((row: AdminPriceListPriceListPrismaType) => {
    setEditRow(row);
  }, []);

  const refreshGrid = useCallback(() => {
    gridRef.current.api?.refreshInfiniteCache();
  }, []);

  const handleSaved = useCallback(() => {
    refreshGrid();
  }, [refreshGrid]);

  return (
    <Stack gap="md">
      <PricesSummaryCards priceListId={priceListId} />

      <Group justify="space-between" align="center">
        <SearchInput
          placeholder={t('addDrawer.searchPlaceholder')}
          value={search}
          onChange={setSearch}
          style={{ width: 280 }}
        />
        <Button
          leftSection={<Plus size={16} />}
          variant="default"
          onClick={openAdd}
        >
          {t('addVariants')}
        </Button>
      </Group>

      <DataTable<AdminPriceListPriceListPrismaType>
        tableId="price-list-prices"
        columns={columns}
        datasource={datasource}
        translations={translations}
        height="calc(100vh - 380px)"
        gridOptions={{
          cellSelection: false,
          suppressCellFocus: true,
          onGridReady: (event) => {
            gridRef.current.api = event.api;
          },
        }}
        showFilterDrawer
        contextMenu={{
          enabled: true,
          onView: handleEdit,
          showView: true,
          showCopy: false,
          showExportCSV: false,
          showExportExcel: false,
          copyColumns: [],
        }}
        onRowClicked={handleEdit}
      />

      <EditPriceRowDrawer
        priceListId={priceListId}
        priceRow={editRow}
        onClose={() => setEditRow(null)}
        onSaved={handleSaved}
      />

      <AddVariantsToPriceListDrawer
        priceListId={priceListId}
        defaultCurrencyCode={defaultCurrencyCode}
        opened={addOpened}
        onClose={closeAdd}
        onAdded={handleSaved}
      />
    </Stack>
  );
}
