import type { RuleTargetEntity } from '../rule-engine/index.js';

export const EvaluationJobStatus = [
  'PENDING',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
] as const;
export type EvaluationJobStatus = (typeof EvaluationJobStatus)[number];

export const EvaluationTrigger = ['SCHEDULED', 'MANUAL'] as const;
export type EvaluationTrigger = (typeof EvaluationTrigger)[number];

export interface EvaluationJobData {
  evaluationJobId: string;
  entityId: string;
  entityType: string;
  targetEntity: RuleTargetEntity;
  ruleTreeId: string;
  triggeredBy: string;
  triggerType: EvaluationTrigger;
}

export interface EvaluationResult {
  recordsEvaluated: number;
  recordsMatched: number;
  durationMs: number;
}

export interface EvaluationEvent {
  jobId: string;
  entityId: string;
  entityType: string;
  status: EvaluationJobStatus;
  result?: EvaluationResult;
  error?: string;
  timestamp: string;
}
