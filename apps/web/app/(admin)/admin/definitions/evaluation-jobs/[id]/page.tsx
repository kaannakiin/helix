'use client';

import type { EvaluationJobDetailResponse } from '@/core/hooks/useAdminEvaluationJobs';
import {
  useAdminEvaluationJob,
  useCancelEvaluationJob,
  useEvaluationJobHistory,
  useRerunEvaluation,
} from '@/core/hooks/useAdminEvaluationJobs';
import { useEvaluationJobStream } from '@/core/hooks/useEvaluationStream';
import {
  ActionIcon,
  Alert,
  Anchor,
  Badge,
  Button,
  Code,
  CopyButton,
  Group,
  Paper,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
  Timeline,
  Title,
  Tooltip,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  EvaluationJobStatusConfigs,
  EvaluationTriggerConfigs,
  RuleTargetEntityConfigs,
} from '@org/constants/enum-configs';
import type { EvaluationEvent } from '@org/types/evaluation';
import { FormCard } from '@org/ui/common/form-card';
import LoadingOverlay from '@org/ui/common/loading-overlay';
import { TerminalLog, type LogEntry } from '@org/ui/terminal-log';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Check,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  Play,
  Terminal,
  XCircle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

const ENTITY_EDIT_ROUTES: Record<string, (id: string) => string> = {
  CustomerGroup: (id) => `/admin/customers/customer-groups/${id}`,
};

function useLiveDuration(
  startedAt: string | null | undefined,
  isRunning: boolean
) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt || !isRunning) {
      setElapsed(0);
      return;
    }

    const start = new Date(startedAt).getTime();
    const tick = () => setElapsed(Date.now() - start);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt, isRunning]);

  return elapsed;
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
    2,
    '0'
  )}:${String(seconds).padStart(2, '0')}`;
}

function buildInitialLogs(data: EvaluationJobDetailResponse): LogEntry[] {
  const logs: LogEntry[] = [];

  logs.push({
    timestamp: data.createdAt,
    level: 'info',
    message: `Job created (trigger: ${data.triggerType})`,
  });

  if (data.startedAt) {
    logs.push({
      timestamp: data.startedAt,
      level: 'info',
      message: 'Evaluation started',
    });
  }

  if (data.status === 'COMPLETED' && data.completedAt) {
    logs.push({
      timestamp: data.completedAt,
      level: 'success',
      message: `Completed: ${data.recordsMatched ?? 0}/${
        data.recordsEvaluated ?? 0
      } matched (${data.durationMs ?? 0}ms)`,
    });
  }

  if (data.status === 'FAILED' && data.completedAt) {
    logs.push({
      timestamp: data.completedAt,
      level: 'error',
      message: data.errorLog ?? 'Unknown error',
    });
  }

  if (data.status === 'CANCELLED' && data.completedAt) {
    logs.push({
      timestamp: data.completedAt,
      level: 'warn',
      message: 'Job cancelled',
    });
  }

  return logs;
}

function eventToLogEntry(event: EvaluationEvent): LogEntry | null {
  switch (event.status) {
    case 'PENDING':
      return {
        timestamp: event.timestamp,
        level: 'info',
        message: 'Job queued, waiting for worker...',
      };
    case 'RUNNING':
      return {
        timestamp: event.timestamp,
        level: 'info',
        message: 'Evaluation started',
      };
    case 'COMPLETED':
      return {
        timestamp: event.timestamp,
        level: 'success',
        message: `Completed: ${event.result?.recordsMatched ?? 0}/${
          event.result?.recordsEvaluated ?? 0
        } matched (${event.result?.durationMs ?? 0}ms)`,
      };
    case 'FAILED':
      return {
        timestamp: event.timestamp,
        level: 'error',
        message: event.error ?? 'Unknown error',
      };
    case 'CANCELLED':
      return {
        timestamp: event.timestamp,
        level: 'warn',
        message: 'Job cancelled',
      };
    default:
      return null;
  }
}

export default function EvaluationJobDetailPage() {
  const t = useTranslations('common.admin.evaluationJobs.detail');
  const tEnums = useTranslations('common.enums');
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isMobile = useMediaQuery('(max-width: 768px)');

  const { data, isLoading, isError, error } = useAdminEvaluationJob(id);

  const isActive = data?.status === 'PENDING' || data?.status === 'RUNNING';
  const isRunning = data?.status === 'RUNNING';

  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    if (data) {
      setLogs(buildInitialLogs(data));
    }
  }, [data?.status]);

  const handleSseEvent = useCallback((event: EvaluationEvent) => {
    const entry = eventToLogEntry(event);
    if (entry) setLogs((prev) => [...prev, entry]);
  }, []);

  useEvaluationJobStream(isActive ? id : null, handleSseEvent);

  const liveDuration = useLiveDuration(data?.startedAt, isRunning);

  const { data: history } = useEvaluationJobHistory(
    data?.entityType ?? null,
    data?.entityId ?? null
  );

  const cancelJob = useCancelEvaluationJob();
  const rerunEvaluation = useRerunEvaluation();

  const handleCancel = async () => {
    try {
      await cancelJob.mutateAsync(id);
      notifications.show({
        color: 'green',
        title: t('cancelSuccess'),
        message: '',
      });
    } catch {
      notifications.show({
        color: 'red',
        title: t('cancelError'),
        message: '',
      });
    }
  };

  const handleRerun = async () => {
    if (!data) return;
    try {
      const result = await rerunEvaluation.mutateAsync(data.entityId);
      notifications.show({
        color: 'green',
        title: t('rerunSuccess'),
        message: '',
      });
      router.push(`/admin/definitions/evaluation-jobs/${result.jobId}`);
    } catch {
      notifications.show({
        color: 'red',
        title: t('rerunError'),
        message: '',
      });
    }
  };

  if (isLoading) return <LoadingOverlay />;

  if (isError) {
    const apiError = error as { isNotFound?: boolean } | null;
    return (
      <Stack p="md" gap="md">
        <Alert
          color="red"
          title={apiError?.isNotFound ? t('notFound') : t('loadError')}
        >
          {apiError?.isNotFound
            ? t('notFoundDescription')
            : t('loadErrorDescription')}
        </Alert>
        <Button
          variant="default"
          leftSection={<ArrowLeft size={16} />}
          onClick={() => router.push('/admin/definitions/evaluation-jobs')}
        >
          {t('backToList')}
        </Button>
      </Stack>
    );
  }

  if (!data) return null;

  const statusConfig = EvaluationJobStatusConfigs[data.status];
  const triggerConfig = EvaluationTriggerConfigs[data.triggerType];
  const targetConfig = RuleTargetEntityConfigs[data.targetEntity];

  const editRoute = ENTITY_EDIT_ROUTES[data.entityType]?.(data.entityId);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString();
  };

  const formatDuration = (ms: number | null) => {
    if (ms == null) return '—';
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const matchRate =
    data.recordsEvaluated && data.recordsMatched != null
      ? ((data.recordsMatched / data.recordsEvaluated) * 100).toFixed(1)
      : null;

  const historyItems = (history ?? []).filter((h) => h.id !== id).slice(0, 10);

  return (
    <Stack gap="lg">
      <div>
        <Group justify="space-between" align="center">
          <Button
            variant="subtle"
            size="compact-sm"
            leftSection={<ArrowLeft size={16} />}
            onClick={() => router.push('/admin/definitions/evaluation-jobs')}
          >
            {t('backToList')}
          </Button>
        </Group>
        <Title order={2} mt="xs">
          {t('title')}
        </Title>
      </div>

      <Group align="flex-start" gap="lg" wrap="wrap">
        <Stack gap="md" style={{ flex: 1, minWidth: isMobile ? '100%' : 400 }}>
          <FormCard
            title={t('jobInfo')}
            icon={FileText}
            iconColor="blue"
            rightSection={
              <Badge color={statusConfig.color} variant="light" size="lg">
                {tEnums(statusConfig.labelKey)}
              </Badge>
            }
          >
            <SimpleGrid cols={2} spacing="md">
              <div>
                <Text size="xs" c="dimmed">
                  {t('targetEntity')}
                </Text>
                <Group gap="xs" mt={4}>
                  <Badge color={targetConfig.color} variant="light">
                    {tEnums(targetConfig.labelKey)}
                  </Badge>
                  {editRoute && (
                    <Anchor
                      component={Link}
                      href={editRoute}
                      size="xs"
                      c="blue"
                    >
                      <ExternalLink size={12} />
                    </Anchor>
                  )}
                </Group>
              </div>
              <div>
                <Text size="xs" c="dimmed">
                  {t('entityType')}
                </Text>
                <Text size="sm" fw={500} mt={4}>
                  {data.entityType}
                </Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">
                  {t('entityId')}
                </Text>
                <Group gap={4} mt={4}>
                  <Code>{data.entityId}</Code>
                  <CopyButton value={data.entityId}>
                    {({ copied, copy }) => (
                      <Tooltip label={copied ? 'Copied' : 'Copy'}>
                        <ActionIcon
                          size="xs"
                          variant="subtle"
                          color={copied ? 'teal' : 'gray'}
                          onClick={copy}
                        >
                          {copied ? <Check size={12} /> : <Copy size={12} />}
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </CopyButton>
                </Group>
              </div>
              <div>
                <Text size="xs" c="dimmed">
                  {t('triggerType')}
                </Text>
                <Badge color={triggerConfig.color} variant="light" mt={4}>
                  {tEnums(triggerConfig.labelKey)}
                </Badge>
              </div>
              <div>
                <Text size="xs" c="dimmed">
                  {t('triggeredBy')}
                </Text>
                <Text size="sm" fw={500} mt={4}>
                  {data.triggeredBy ?? '—'}
                </Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">
                  {t('attemptCount')}
                </Text>
                <Text size="sm" fw={500} mt={4}>
                  {data.attemptCount}
                </Text>
              </div>
            </SimpleGrid>
          </FormCard>
          <FormCard title={t('timing')} icon={Clock} iconColor="violet">
            <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
              <div>
                <Text size="xs" c="dimmed">
                  {t('createdAt')}
                </Text>
                <Text size="sm" fw={500} mt={4}>
                  {formatDate(data.createdAt)}
                </Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">
                  {t('startedAt')}
                </Text>
                <Text size="sm" fw={500} mt={4}>
                  {formatDate(data.startedAt)}
                </Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">
                  {t('completedAt')}
                </Text>
                <Text size="sm" fw={500} mt={4}>
                  {formatDate(data.completedAt)}
                </Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">
                  {t('currentDuration')}
                </Text>
                {isRunning ? (
                  <Text size="lg" fw={700} mt={4} ff="monospace" c="blue">
                    {formatElapsed(liveDuration)}
                  </Text>
                ) : (
                  <Text size="sm" fw={500} mt={4}>
                    {formatDuration(data.durationMs)}
                  </Text>
                )}
              </div>
            </SimpleGrid>
          </FormCard>
          {data.status === 'COMPLETED' && (
            <FormCard title={t('results')} icon={BarChart3} iconColor="green">
              <SimpleGrid cols={3} spacing="md">
                <div>
                  <Text size="xs" c="dimmed">
                    {t('recordsEvaluated')}
                  </Text>
                  <Text size="lg" fw={700} mt={4}>
                    {data.recordsEvaluated ?? 0}
                  </Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">
                    {t('recordsMatched')}
                  </Text>
                  <Text size="lg" fw={700} mt={4}>
                    {data.recordsMatched ?? 0}
                  </Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">
                    {t('matchRate')}
                  </Text>
                  <Text size="lg" fw={700} mt={4}>
                    {matchRate != null ? `${matchRate}%` : '—'}
                  </Text>
                </div>
              </SimpleGrid>
            </FormCard>
          )}
          {data.status === 'FAILED' && data.errorLog && (
            <FormCard
              title={t('errorLog')}
              icon={AlertTriangle}
              iconColor="red"
            >
              <ScrollArea h={200}>
                <Code block>{data.errorLog}</Code>
              </ScrollArea>
            </FormCard>
          )}
          <FormCard title={t('executionLog')} icon={Terminal} iconColor="gray">
            <TerminalLog entries={logs} height={300} />
          </FormCard>
        </Stack>

        <Stack
          gap="md"
          style={{
            width: isMobile ? '100%' : 340,
            flexShrink: 0,
            position: isMobile ? undefined : 'sticky',
            top: isMobile ? undefined : 'var(--mantine-spacing-md)',
          }}
        >
          <FormCard title={t('actions')} icon={Activity} iconColor="orange">
            <Stack gap="sm">
              {data.entityType === 'CustomerGroup' && (
                <Button
                  fullWidth
                  leftSection={<Play size={16} />}
                  onClick={handleRerun}
                  loading={rerunEvaluation.isPending}
                  disabled={isActive}
                >
                  {t('rerun')}
                </Button>
              )}
              {isActive && (
                <Button
                  fullWidth
                  variant="light"
                  color="red"
                  leftSection={<XCircle size={16} />}
                  onClick={handleCancel}
                  loading={cancelJob.isPending}
                  disabled={data.status !== 'PENDING'}
                >
                  {t('abortJob')}
                </Button>
              )}
            </Stack>
          </FormCard>

          <FormCard title={t('history')} icon={Clock} iconColor="gray">
            {historyItems.length === 0 ? (
              <Text size="sm" c="dimmed">
                {t('noHistory')}
              </Text>
            ) : (
              <Timeline active={-1} bulletSize={24} lineWidth={2}>
                {historyItems.map((job) => {
                  const jobStatusConfig =
                    EvaluationJobStatusConfigs[job.status];
                  return (
                    <Timeline.Item
                      key={job.id}
                      bullet={
                        <Badge
                          size="xs"
                          circle
                          color={jobStatusConfig.color}
                          variant="filled"
                        >
                          {' '}
                        </Badge>
                      }
                    >
                      <Paper
                        p="xs"
                        withBorder
                        style={{ cursor: 'pointer' }}
                        onClick={() =>
                          router.push(
                            `/admin/definitions/evaluation-jobs/${job.id}`
                          )
                        }
                      >
                        <Group justify="space-between">
                          <Badge
                            size="sm"
                            color={jobStatusConfig.color}
                            variant="light"
                          >
                            {tEnums(jobStatusConfig.labelKey)}
                          </Badge>
                          <Text size="xs" c="dimmed">
                            {formatDuration(job.durationMs)}
                          </Text>
                        </Group>
                        <Text size="xs" c="dimmed" mt={4}>
                          {formatDate(job.createdAt)}
                        </Text>
                      </Paper>
                    </Timeline.Item>
                  );
                })}
              </Timeline>
            )}
          </FormCard>
        </Stack>
      </Group>
    </Stack>
  );
}
