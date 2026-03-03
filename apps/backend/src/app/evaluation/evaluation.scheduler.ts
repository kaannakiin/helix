import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { parseExpression } from 'cron-parser';
import Redis from 'ioredis';
import { EMPTY, Subject, from, merge, timer } from 'rxjs';
import { catchError, exhaustMap, takeUntil } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service';
import {
  EvaluationService,
  SCHEDULER_REFRESH_CHANNEL,
} from './evaluation.service';

const POLL_INTERVAL = 60_000;

@Injectable()
export class EvaluationScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EvaluationScheduler.name);
  private readonly destroy$ = new Subject<void>();
  private readonly refresh$ = new Subject<void>();
  private subscriber!: Redis;

  constructor(
    private readonly prisma: PrismaService,
    private readonly evaluationService: EvaluationService,
    private readonly config: ConfigService
  ) {}

  async onModuleInit() {
    await this.cleanupStaleJobs();

    this.logger.log('Evaluation scheduler started');

    this.subscriber = new Redis(
      this.config.getOrThrow<string>('REDIS_URL')
    );

    this.subscriber.subscribe(SCHEDULER_REFRESH_CHANNEL, (err) => {
      if (err) {
        this.logger.error('Failed to subscribe to scheduler refresh channel', err);
      } else {
        this.logger.log('Subscribed to scheduler refresh channel');
      }
    });

    this.subscriber.on('message', () => {
      this.logger.debug('Received scheduler refresh signal');
      this.refresh$.next();
    });

    merge(timer(0, POLL_INTERVAL), this.refresh$)
      .pipe(
        takeUntil(this.destroy$),
        exhaustMap(() =>
          from(this.enqueueDueCustomerGroups()).pipe(
            catchError((error) => {
              this.logger.error('Scheduler tick failed', error);
              return EMPTY;
            })
          )
        )
      )
      .subscribe();
  }

  onModuleDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscriber.unsubscribe(SCHEDULER_REFRESH_CHANNEL);
    this.subscriber.disconnect();
    this.logger.log('Evaluation scheduler stopped');
  }

  private async cleanupStaleJobs() {
    const staleJobs = await this.prisma.evaluationJob.updateMany({
      where: { status: { in: ['PENDING', 'RUNNING'] } },
      data: { status: 'CANCELLED', completedAt: new Date() },
    });

    if (staleJobs.count > 0) {
      this.logger.warn(
        `Startup cleanup: cancelled ${staleJobs.count} stale job(s) from previous run`
      );
    }
  }

  private async enqueueDueCustomerGroups() {
    const now = new Date();

    const groups = await this.prisma.customerGroup.findMany({
      where: {
        type: 'RULE_BASED',
        isActive: true,
        ruleTreeId: { not: null },
        cronExpression: { not: null },
      },
      include: { ruleTree: { select: { id: true } } },
    });

    this.logger.log(
      `Scheduler tick: found ${groups.length} eligible group(s)`
    );

    for (const group of groups) {
      try {
        if (!group.cronExpression || !group.ruleTree) continue;

        const isDue = this.isCronDue(
          group.cronExpression,
          group.lastEvaluatedAt,
          now
        );

        this.logger.log(
          `Group "${group.name}": cron="${group.cronExpression}", lastEvaluated=${group.lastEvaluatedAt?.toISOString() ?? 'never'}, isDue=${isDue}`
        );

        if (!isDue) continue;

        const existingJob = await this.prisma.evaluationJob.findFirst({
          where: {
            entityId: group.id,
            entityType: 'CustomerGroup',
            status: { in: ['PENDING', 'RUNNING'] },
          },
        });

        if (existingJob) {
          this.logger.debug(
            `Skipping ${group.name}: existing job ${existingJob.id} is ${existingJob.status}`
          );
          continue;
        }

        await this.evaluationService.createAndEnqueue({
          entityId: group.id,
          entityType: 'CustomerGroup',
          targetEntity: 'USER',
          ruleTreeId: group.ruleTree.id,
          triggeredBy: 'SCHEDULER',
          triggerType: 'SCHEDULED',
        });

        this.logger.log(`Enqueued evaluation for CustomerGroup: ${group.name}`);
      } catch (error) {
        this.logger.error(`Failed to enqueue CustomerGroup ${group.id}`, error);
      }
    }
  }

  private isCronDue(
    cronExpression: string,
    lastEvaluatedAt: Date | null,
    now: Date
  ): boolean {
    if (!lastEvaluatedAt) return true;

    try {
      const interval = parseExpression(cronExpression, {
        currentDate: lastEvaluatedAt,
      });
      const nextFire = interval.next().toDate();
      return nextFire <= now;
    } catch {
      this.logger.warn(`Invalid cron expression: ${cronExpression}`);
      return false;
    }
  }
}
