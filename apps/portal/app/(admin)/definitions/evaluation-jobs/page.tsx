'use client';

import type { EvaluationJobDetailResponse } from '@/core/hooks/useAdminEvaluationJobs';
import { useCancelEvaluationJob } from '@/core/hooks/useAdminEvaluationJobs';
import { useActiveJobStreams } from '@/core/hooks/useEvaluationStream';
import { apiClient } from '@/core/lib/api/api-client';
import { Group, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  EvaluationJobStatusConfigs,
  EvaluationTriggerConfigs,
  RuleTargetEntityConfigs,
  buildColorMap,
  buildEnumOptions,
} from '@org/constants/enum-configs';
import type { PaginatedResponse } from '@org/types/pagination';
import {
  DataTable,
  serializeGridQuery,
  useColumnFactory,
  type CopyColumn,
  type DataTableFilterTranslations,
  type DataTableTranslations,
} from '@org/ui';
import type { GridApi, IDatasource, IGetRowsParams } from 'ag-grid-community';
import { ClipboardList, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useRef } from 'react';

export default function AdminEvaluationJobsPage() {
  const t = useTranslations('frontend.admin.evaluationJobs');
  const tEnums = useTranslations('frontend.enums');
  const router = useRouter();
  const tFilters = useTranslations('frontend.dataTable.filters');
  const tColumnVisibility = useTranslations(
    'frontend.dataTable.columnVisibility'
  );
  const cancelJob = useCancelEvaluationJob();
  const gridApiRef = useRef<GridApi | null>(null);

  const { trackJob } = useActiveJobStreams(
    useCallback(() => {
      gridApiRef.current?.purgeInfiniteCache();
    }, [])
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
        status: t('table.status'),
        entityType: t('table.entityType'),
        targetEntity: t('table.targetEntity'),
        triggerType: t('table.triggerType'),
        triggeredBy: t('table.triggeredBy'),
        recordsEvaluated: t('table.recordsEvaluated'),
        recordsMatched: t('table.recordsMatched'),
        durationMs: t('table.durationMs'),
        completedAt: t('table.completedAt'),
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
      columnVisibility: {
        title: tColumnVisibility('title'),
        showAll: tColumnVisibility('showAll'),
        hiddenCount: tColumnVisibility.raw('hiddenCount'),
      },
      noRows: {
        label: t('noRows.label'),
        icon: <ClipboardList size={40} />,
      },
    }),
    [t, tColumnVisibility, filters]
  );

  const { createColumn } = useColumnFactory(translations);

  const columns = useMemo(
    () => [
      createColumn<EvaluationJobDetailResponse>('status', {
        headerKey: 'status',
        type: 'badge',
        minWidth: 130,
        colorMap: buildColorMap(EvaluationJobStatusConfigs),
        enumOptions: buildEnumOptions(EvaluationJobStatusConfigs, tEnums),
      }),
      createColumn<EvaluationJobDetailResponse>('entityType', {
        headerKey: 'entityType',
        type: 'text',
        minWidth: 150,
      }),
      createColumn<EvaluationJobDetailResponse>('targetEntity', {
        headerKey: 'targetEntity',
        type: 'badge',
        minWidth: 120,
        colorMap: buildColorMap(RuleTargetEntityConfigs),
        enumOptions: buildEnumOptions(RuleTargetEntityConfigs, tEnums),
      }),
      createColumn<EvaluationJobDetailResponse>('triggerType', {
        headerKey: 'triggerType',
        type: 'badge',
        minWidth: 120,
        colorMap: buildColorMap(EvaluationTriggerConfigs),
        enumOptions: buildEnumOptions(EvaluationTriggerConfigs, tEnums),
      }),
      createColumn<EvaluationJobDetailResponse>('triggeredBy', {
        headerKey: 'triggeredBy',
        type: 'text',
        minWidth: 130,
      }),
      createColumn<EvaluationJobDetailResponse>('recordsEvaluated', {
        headerKey: 'recordsEvaluated',
        type: 'number',
        minWidth: 110,
      }),
      createColumn<EvaluationJobDetailResponse>('recordsMatched', {
        headerKey: 'recordsMatched',
        type: 'number',
        minWidth: 110,
      }),
      createColumn<EvaluationJobDetailResponse>('durationMs', {
        headerKey: 'durationMs',
        type: 'number',
        minWidth: 100,
        valueFormatter: (params) => {
          if (params.value == null) return '—';
          return `${(params.value / 1000).toFixed(1)}s`;
        },
      }),
      createColumn<EvaluationJobDetailResponse>('completedAt', {
        headerKey: 'completedAt',
        type: 'datetime',
        minWidth: 170,
      }),
      createColumn<EvaluationJobDetailResponse>('createdAt', {
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
      completedAt: (v) => (v ? new Date(v as string).toLocaleString() : '—'),
      createdAt: (v) => (v ? new Date(v as string).toLocaleDateString() : '—'),
      durationMs: (v) =>
        v != null ? `${((v as number) / 1000).toFixed(1)}s` : '—',
    }),
    []
  );

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

          const res = await apiClient.post<
            PaginatedResponse<EvaluationJobDetailResponse>
          >('/admin/evaluation-jobs/query', query);

          for (const job of res.data.data) {
            if (job.status === 'PENDING' || job.status === 'RUNNING') {
              trackJob(job.id);
            }
          }

          params.successCallback(res.data.data, res.data.pagination.total);
        } catch {
          params.failCallback();
        }
      },
    }),
    [trackJob]
  );

  const handleViewDetails = useCallback(
    (row: EvaluationJobDetailResponse) => {
      router.push(`/definitions/evaluation-jobs/${row.id}`);
    },
    [router]
  );

  const handleCancelJob = useCallback(
    async (row: EvaluationJobDetailResponse) => {
      try {
        await cancelJob.mutateAsync(row.id);
        notifications.show({
          color: 'green',
          title: t('detail.cancelSuccess'),
          message: '',
        });
        gridApiRef.current?.purgeInfiniteCache();
      } catch {
        notifications.show({
          color: 'red',
          title: t('detail.cancelError'),
          message: '',
        });
      }
    },
    [cancelJob, t]
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
      </Group>

      <DataTable<EvaluationJobDetailResponse>
        tableId="evaluationJobs"
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
            gridApiRef.current = event.api;
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
          customItems: [
            {
              key: 'cancel-job',
              label: t('contextMenu.cancel'),
              icon: <XCircle size={14} />,
              color: 'red',
              hidden: ({ row }) => row?.status !== 'PENDING',
              onClick: ({ row }) => {
                if (row) handleCancelJob(row);
              },
            },
          ],
        }}
      />
    </Stack>
  );
}
