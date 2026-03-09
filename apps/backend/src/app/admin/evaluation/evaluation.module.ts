import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { DecisionTreeConverter } from './converters/decision-tree-converter';
import { EvaluationSseService } from './evaluation-sse.service';
import { EvaluationController } from './evaluation.controller';
import { EvaluationProcessor } from './evaluation.processor';
import { EvaluationScheduler } from './evaluation.scheduler';
import { EVALUATION_QUEUE, EvaluationService } from './evaluation.service';
import { CustomerGroupEvaluator } from './evaluators/customer-group.evaluator';
import { EvaluatorRegistry } from './evaluators/evaluator-registry';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.getOrThrow<string>('REDIS_URL');
        const parsed = new URL(redisUrl);
        return {
          connection: {
            host: parsed.hostname,
            port: parseInt(parsed.port || '6379'),
            password: parsed.password || undefined,
            db: parseInt(parsed.pathname?.slice(1) || '0'),
            maxRetriesPerRequest: null,
          },
        };
      },
    }),
    BullModule.registerQueue({
      name: EVALUATION_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      },
    }),
    PrismaModule,
  ],
  controllers: [EvaluationController],
  providers: [
    EvaluationService,
    EvaluationProcessor,
    EvaluationScheduler,
    EvaluationSseService,
    DecisionTreeConverter,
    EvaluatorRegistry,
    CustomerGroupEvaluator,
  ],
  exports: [EvaluationService],
})
export class EvaluationModule {}
