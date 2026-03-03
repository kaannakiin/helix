import type { EvaluationResult } from '@org/types/evaluation';

export interface EvaluateContext {
  entityId: string;
  entityType: string;
  evaluationJobId: string;
}

export abstract class BaseEvaluator {
  abstract readonly targetEntity: string;
  abstract evaluate(ctx: EvaluateContext): Promise<EvaluationResult>;
}
