import { DATA_ACCESS_KEYS } from '@org/constants/data-keys';
import type { EvaluationJobStatus } from '@org/types/evaluation';
import type { RuleTargetEntity } from '@org/types/rule-engine';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api/api-client';

export interface EvaluationJobDetailResponse {
  id: string;
  status: EvaluationJobStatus;
  targetEntity: RuleTargetEntity;
  entityId: string;
  entityType: string;
  ruleTreeSnapshot: unknown | null;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  recordsEvaluated: number | null;
  recordsMatched: number | null;
  errorLog: string | null;
  attemptCount: number;
  bullJobId: string | null;
  triggeredBy: string | null;
  triggerType: 'SCHEDULED' | 'MANUAL';
  createdAt: string;
  updatedAt: string;
}

export const useAdminEvaluationJob = (id: string) => {
  return useQuery({
    queryKey: DATA_ACCESS_KEYS.admin.evaluationJobs.detail(id),
    enabled: !!id,
    queryFn: async () => {
      const res = await apiClient.get<EvaluationJobDetailResponse>(
        `/admin/evaluation-jobs/${id}`
      );
      return res.data;
    },
  });
};

export const useEvaluationJobHistory = (
  entityType: string | null,
  entityId: string | null
) => {
  return useQuery({
    queryKey: DATA_ACCESS_KEYS.admin.evaluationJobs.entityHistory(
      entityType ?? '',
      entityId ?? ''
    ),
    enabled: !!entityType && !!entityId,
    queryFn: async () => {
      const res = await apiClient.get<EvaluationJobDetailResponse[]>(
        `/admin/evaluation-jobs/entity/${entityType}/${entityId}`
      );
      return res.data;
    },
  });
};

export const useCancelEvaluationJob = () => {
  return useMutation({
    mutationFn: async (jobId: string) => {
      const res = await apiClient.post(
        `/admin/evaluation-jobs/${jobId}/cancel`
      );
      return res.data;
    },
    onSuccess: (_result, jobId, _mutateResult, context) => {
      context.client.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.evaluationJobs.detail(jobId),
      });
      context.client.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.evaluationJobs.list,
      });
    },
  });
};

export const useRerunEvaluation = () => {
  return useMutation({
    mutationFn: async (entityId: string) => {
      const res = await apiClient.post<{ jobId: string }>(
        `/admin/customer-groups/${entityId}/evaluate`
      );
      return res.data;
    },
    onSuccess: (_result, _vars, _mutateResult, context) => {
      context.client.invalidateQueries({
        queryKey: DATA_ACCESS_KEYS.admin.evaluationJobs.list,
      });
    },
  });
};
