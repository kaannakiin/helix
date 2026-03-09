import { DATA_ACCESS_KEYS } from '@org/constants/data-keys';
import type { EvaluationEvent } from '@org/types/evaluation';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

const TERMINAL_STATUSES = new Set(['COMPLETED', 'FAILED', 'CANCELLED']);

export function useEvaluationJobStream(
  jobId: string | null,
  onEvent?: (event: EvaluationEvent) => void
) {
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const es = new EventSource(`/api/admin/evaluation-jobs/${jobId}/stream`);
    eventSourceRef.current = es;

    es.onmessage = (msg) => {
      try {
        const event: EvaluationEvent = JSON.parse(msg.data);
        onEvent?.(event);

        queryClient.invalidateQueries({
          queryKey: DATA_ACCESS_KEYS.admin.evaluationJobs.detail(jobId),
        });
        queryClient.invalidateQueries({
          queryKey: DATA_ACCESS_KEYS.admin.evaluationJobs.list,
        });

        if (TERMINAL_STATUSES.has(event.status)) {
          es.close();
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [jobId, onEvent, queryClient]);
}

export function useEvaluationEntityStream(
  entityType: string | null,
  entityId: string | null,
  onEvent?: (event: EvaluationEvent) => void
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!entityType || !entityId) return;

    const es = new EventSource(
      `/api/admin/evaluation-jobs/entity/${entityType}/${entityId}/stream`
    );

    es.onmessage = (msg) => {
      try {
        const event: EvaluationEvent = JSON.parse(msg.data);
        onEvent?.(event);

        queryClient.invalidateQueries({
          queryKey: DATA_ACCESS_KEYS.admin.evaluationJobs.entityHistory(
            entityType,
            entityId
          ),
        });
        queryClient.invalidateQueries({
          queryKey: DATA_ACCESS_KEYS.admin.evaluationJobs.list,
        });
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
    };
  }, [entityType, entityId, onEvent, queryClient]);
}

/**
 * Tracks multiple active (PENDING/RUNNING) evaluation jobs via SSE.
 * Used by the list page to get real-time status updates.
 */
export function useActiveJobStreams(onAnyEvent?: () => void) {
  const activeStreamsRef = useRef<Map<string, EventSource>>(new Map());
  const queryClient = useQueryClient();

  const trackJob = useCallback(
    (jobId: string) => {
      if (activeStreamsRef.current.has(jobId)) return;

      const es = new EventSource(`/api/admin/evaluation-jobs/${jobId}/stream`);

      es.onmessage = (msg) => {
        try {
          const event: EvaluationEvent = JSON.parse(msg.data);

          if (TERMINAL_STATUSES.has(event.status)) {
            es.close();
            activeStreamsRef.current.delete(jobId);
          }

          queryClient.invalidateQueries({
            queryKey: DATA_ACCESS_KEYS.admin.evaluationJobs.list,
          });
          onAnyEvent?.();
        } catch {
          // ignore parse errors
        }
      };

      es.onerror = () => {
        es.close();
        activeStreamsRef.current.delete(jobId);
      };

      activeStreamsRef.current.set(jobId, es);
    },
    [queryClient, onAnyEvent]
  );

  const untrackAll = useCallback(() => {
    for (const es of activeStreamsRef.current.values()) {
      es.close();
    }
    activeStreamsRef.current.clear();
  }, []);

  useEffect(() => {
    return () => {
      untrackAll();
    };
  }, [untrackAll]);

  return { trackJob, untrackAll };
}
