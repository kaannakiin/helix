import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma } from '@org/prisma/client';
import type { FilterCondition, SortCondition } from '@org/types/data-query';
import type {
  EvaluationEvent,
  EvaluationJobData,
  EvaluationResult,
  EvaluationTrigger,
} from '@org/types/evaluation';
import type { RuleTargetEntity } from '@org/types/rule-engine';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { buildPrismaQuery } from '../../core/utils/prisma-query-builder';
import { PrismaService } from '../prisma/prisma.service';

export const EVALUATION_QUEUE = 'evaluation';
export const EVALUATION_EVENTS_CHANNEL = 'evaluation:events';
export const SCHEDULER_REFRESH_CHANNEL = 'scheduler:refresh';

@Injectable()
export class EvaluationService {
  private readonly logger = new Logger(EvaluationService.name);
  private readonly publisher: Redis;

  constructor(
    @InjectQueue(EVALUATION_QUEUE) private readonly evaluationQueue: Queue,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {
    this.publisher = new Redis(this.config.getOrThrow<string>('REDIS_URL'));
  }

  async createAndEnqueue(params: {
    entityId: string;
    entityType: string;
    targetEntity: RuleTargetEntity;
    ruleTreeId: string;
    triggeredBy: string;
    triggerType: EvaluationTrigger;
  }) {
    const ruleTree = await this.prisma.ruleTree.findUnique({
      where: { id: params.ruleTreeId },
    });

    const job = await this.prisma.evaluationJob.create({
      data: {
        status: 'PENDING',
        targetEntity: params.targetEntity,
        entityId: params.entityId,
        entityType: params.entityType,
        ruleTreeSnapshot: ruleTree?.conditions ?? undefined,
        triggeredBy: params.triggeredBy,
        triggerType: params.triggerType,
      },
    });

    const jobData: EvaluationJobData = {
      evaluationJobId: job.id,
      entityId: params.entityId,
      entityType: params.entityType,
      targetEntity: params.targetEntity,
      ruleTreeId: params.ruleTreeId,
      triggeredBy: params.triggeredBy,
      triggerType: params.triggerType,
    };

    await this.evaluationQueue.add('evaluate', jobData, {
      jobId: `eval-${params.entityType}-${params.entityId}-${job.id}`,
    });

    await this.publishEvent({
      jobId: job.id,
      entityId: params.entityId,
      entityType: params.entityType,
      status: 'PENDING',
      timestamp: new Date().toISOString(),
    });

    return { id: job.id };
  }

  async markRunning(jobId: string, bullJobId?: string) {
    await this.prisma.evaluationJob.update({
      where: { id: jobId },
      data: {
        status: 'RUNNING',
        startedAt: new Date(),
        bullJobId: bullJobId ?? null,
      },
    });

    const job = await this.prisma.evaluationJob.findUniqueOrThrow({
      where: { id: jobId },
    });

    await this.publishEvent({
      jobId,
      entityId: job.entityId,
      entityType: job.entityType,
      status: 'RUNNING',
      timestamp: new Date().toISOString(),
    });
  }

  async markCompleted(jobId: string, result: EvaluationResult) {
    const job = await this.prisma.evaluationJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        durationMs: result.durationMs,
        recordsEvaluated: result.recordsEvaluated,
        recordsMatched: result.recordsMatched,
      },
    });

    await this.publishEvent({
      jobId,
      entityId: job.entityId,
      entityType: job.entityType,
      status: 'COMPLETED',
      result,
      timestamp: new Date().toISOString(),
    });
  }

  async markFailed(jobId: string, errorMessage: string, attemptCount: number) {
    const job = await this.prisma.evaluationJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errorLog: errorMessage,
        attemptCount,
      },
    });

    await this.publishEvent({
      jobId,
      entityId: job.entityId,
      entityType: job.entityType,
      status: 'FAILED',
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }

  async cancelJob(jobId: string) {
    const job = await this.prisma.evaluationJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('common.errors.evaluation_job_not_found');
    }
    if (job.status !== 'PENDING') {
      throw new BadRequestException(
        'common.errors.evaluation_job_not_cancellable'
      );
    }

    if (job.bullJobId) {
      const bullJob = await this.evaluationQueue.getJob(job.bullJobId);
      if (bullJob) await bullJob.remove();
    }

    await this.prisma.evaluationJob.update({
      where: { id: jobId },
      data: { status: 'CANCELLED', completedAt: new Date() },
    });

    await this.publishEvent({
      jobId,
      entityId: job.entityId,
      entityType: job.entityType,
      status: 'CANCELLED',
      timestamp: new Date().toISOString(),
    });
  }

  async getJobById(id: string) {
    const job = await this.prisma.evaluationJob.findUnique({
      where: { id },
    });
    if (!job) {
      throw new NotFoundException('common.errors.evaluation_job_not_found');
    }
    return job;
  }

  async getEntityHistory(entityType: string, entityId: string) {
    return this.prisma.evaluationJob.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getEvaluationJobs(query: {
    page: number;
    limit: number;
    filters?: Record<string, FilterCondition>;
    sort?: SortCondition[];
  }) {
    const { page, limit, filters, sort } = query;

    const { where, orderBy, skip, take } = buildPrismaQuery({
      page,
      limit,
      filters,
      sort,
      defaultSort: { field: 'createdAt', order: 'desc' },
    });

    const [items, total] = await Promise.all([
      this.prisma.evaluationJob.findMany({
        where: where as Prisma.EvaluationJobWhereInput,
        orderBy: orderBy as
          | Prisma.EvaluationJobOrderByWithRelationInput
          | Prisma.EvaluationJobOrderByWithRelationInput[],
        skip,
        take,
      }),
      this.prisma.evaluationJob.count({
        where: where as Prisma.EvaluationJobWhereInput,
      }),
    ]);

    return {
      data: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async notifySchedulerRefresh(reason?: string) {
    try {
      await this.publisher.publish(
        SCHEDULER_REFRESH_CHANNEL,
        JSON.stringify({ reason, timestamp: new Date().toISOString() })
      );
    } catch (error) {
      this.logger.warn('Failed to publish scheduler refresh', error);
    }
  }

  private async publishEvent(event: EvaluationEvent) {
    try {
      await this.publisher.publish(
        EVALUATION_EVENTS_CHANNEL,
        JSON.stringify(event)
      );
    } catch (error) {
      this.logger.warn('Failed to publish evaluation event', error);
    }
  }
}
