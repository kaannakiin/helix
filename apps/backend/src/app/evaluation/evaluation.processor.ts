import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type {
  EvaluationJobData,
  EvaluationResult,
} from '@org/types/evaluation';
import type { Job } from 'bullmq';
import { EVALUATION_QUEUE, EvaluationService } from './evaluation.service';
import { EvaluatorRegistry } from './evaluators/evaluator-registry';

@Processor(EVALUATION_QUEUE)
export class EvaluationProcessor extends WorkerHost {
  private readonly logger = new Logger(EvaluationProcessor.name);

  constructor(
    private readonly evaluationService: EvaluationService,
    private readonly evaluatorRegistry: EvaluatorRegistry
  ) {
    super();
  }

  async process(job: Job<EvaluationJobData>): Promise<EvaluationResult> {
    const { evaluationJobId, entityId, entityType, targetEntity } = job.data;

    this.logger.log(
      `Processing evaluation job ${evaluationJobId} for ${entityType}:${entityId}`
    );

    await this.evaluationService.markRunning(evaluationJobId, job.id);

    try {
      const evaluator = this.evaluatorRegistry.getEvaluator(targetEntity);

      const result = await evaluator.evaluate({
        entityId,
        entityType,
        evaluationJobId,
      });

      await this.evaluationService.markCompleted(evaluationJobId, result);

      this.logger.log(
        `Evaluation job ${evaluationJobId} completed: ${result.recordsMatched}/${result.recordsEvaluated} matched in ${result.durationMs}ms`
      );

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      await this.evaluationService.markFailed(
        evaluationJobId,
        errorMessage,
        job.attemptsMade + 1
      );

      this.logger.error(
        `Evaluation job ${evaluationJobId} failed: ${errorMessage}`
      );

      throw error;
    }
  }
}
