import {
  Badge,
  HoverCard,
  Skeleton,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import type { ICellRendererParams } from 'ag-grid-community';
import { useCallback, useRef, useState, type ReactNode } from 'react';

type FetchState<TResult> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: TResult }
  | { status: 'error'; error: string };

export interface HoverCardCellRendererParams<
  TData = unknown,
  TResult = unknown
> {
  fetchFn: (rowData: TData) => Promise<TResult>;
  renderContent: (data: TResult, rowData: TData) => ReactNode;
  renderTrigger?: (value: unknown, rowData: TData) => ReactNode;
  isHoverable?: (value: unknown, rowData: TData) => boolean;
  cacheKey?: (rowData: TData) => string;
  openDelay?: number;
  closeDelay?: number;
  dropdownWidth?: number;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const hoverCardCache = new Map<string, unknown>();

export function clearHoverCardCache(keyPrefix?: string) {
  if (!keyPrefix) {
    hoverCardCache.clear();
    return;
  }
  for (const key of hoverCardCache.keys()) {
    if (key.startsWith(keyPrefix)) {
      hoverCardCache.delete(key);
    }
  }
}

function DefaultTrigger({ value }: { value: unknown }) {
  const num = typeof value === 'number' ? value : 0;

  if (num === 0) {
    return (
      <Text size="sm" c="dimmed">
        —
      </Text>
    );
  }

  return (
    <Badge variant="light" color="teal" size="sm">
      {num}
    </Badge>
  );
}

function HoverCardSkeleton() {
  return (
    <Stack gap="xs">
      <Skeleton height={14} width="80%" />
      <Skeleton height={14} width="60%" />
      <Skeleton height={14} width="70%" />
    </Stack>
  );
}

type HoverCardRendererProps = ICellRendererParams &
  HoverCardCellRendererParams<unknown, unknown>;

export function HoverCardCellRenderer({
  value,
  data: rowData,
  node,
  fetchFn,
  renderContent,
  renderTrigger,
  isHoverable,
  cacheKey: cacheKeyFn,
  openDelay = 300,
  closeDelay = 200,
  dropdownWidth = 320,
  position = 'bottom',
}: HoverCardRendererProps) {
  const [fetchState, setFetchState] = useState<FetchState<unknown>>({
    status: 'idle',
  });
  const abortRef = useRef<AbortController | null>(null);

  if (!rowData || node?.id === undefined) {
    return null;
  }

  const hoverable = isHoverable ? isHoverable(value, rowData) : true;

  const resolvedCacheKey = cacheKeyFn
    ? cacheKeyFn(rowData)
    : (rowData as Record<string, unknown>).id
    ? `hc_${(rowData as Record<string, unknown>).id}`
    : undefined;

  const trigger = renderTrigger ? (
    renderTrigger(value, rowData)
  ) : (
    <DefaultTrigger value={value} />
  );

  const handleOpen = useCallback(async () => {
    if (resolvedCacheKey && hoverCardCache.has(resolvedCacheKey)) {
      setFetchState({
        status: 'success',
        data: hoverCardCache.get(resolvedCacheKey),
      });
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setFetchState({ status: 'loading' });

    try {
      const result = await fetchFn(rowData);

      if (controller.signal.aborted) return;

      if (resolvedCacheKey) {
        hoverCardCache.set(resolvedCacheKey, result);
      }

      setFetchState({ status: 'success', data: result });
    } catch (err) {
      if (controller.signal.aborted) return;
      setFetchState({
        status: 'error',
        error: err instanceof Error ? err.message : 'Fetch failed',
      });
    }
  }, [fetchFn, rowData, resolvedCacheKey]);

  const handleRetry = useCallback(() => {
    if (resolvedCacheKey) {
      hoverCardCache.delete(resolvedCacheKey);
    }
    handleOpen();
  }, [resolvedCacheKey, handleOpen]);

  if (!hoverable) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}
      >
        {trigger}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
      }}
    >
      <HoverCard
        width={dropdownWidth}
        position={position}
        shadow="md"
        openDelay={openDelay}
        closeDelay={closeDelay}
        withinPortal
        onOpen={handleOpen}
      >
        <HoverCard.Target>
          <UnstyledButton style={{ cursor: 'pointer' }}>
            {trigger}
          </UnstyledButton>
        </HoverCard.Target>
        <HoverCard.Dropdown>
          {fetchState.status === 'loading' && <HoverCardSkeleton />}
          {fetchState.status === 'idle' && <HoverCardSkeleton />}
          {fetchState.status === 'error' && (
            <Stack gap="xs" align="center">
              <Text size="sm" c="red">
                {fetchState.error}
              </Text>
              <UnstyledButton onClick={handleRetry}>
                <Text size="xs" c="blue" td="underline">
                  Retry
                </Text>
              </UnstyledButton>
            </Stack>
          )}
          {fetchState.status === 'success' &&
            renderContent(fetchState.data, rowData)}
        </HoverCard.Dropdown>
      </HoverCard>
    </div>
  );
}
