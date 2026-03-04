import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import type { EvaluationEvent } from '@org/types/evaluation';
import Redis from 'ioredis';
import { Observable, Subject, filter, map } from 'rxjs';
import { REDIS_CLIENT } from '../redis/redis.constants.js';
import { EVALUATION_EVENTS_CHANNEL } from './evaluation.service.js';

@Injectable()
export class EvaluationSseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EvaluationSseService.name);
  private readonly subscriber: Redis;
  private readonly events$ = new Subject<EvaluationEvent>();

  constructor(@Inject(REDIS_CLIENT) redis: Redis) {
    this.subscriber = redis.duplicate();
  }

  onModuleInit() {
    this.subscriber.subscribe(EVALUATION_EVENTS_CHANNEL, (err) => {
      if (err) {
        this.logger.error('Failed to subscribe to evaluation events', err);
      } else {
        this.logger.log('Subscribed to evaluation events channel');
      }
    });

    this.subscriber.on('message', (_channel: string, message: string) => {
      try {
        const event = JSON.parse(message) as EvaluationEvent;
        this.events$.next(event);
      } catch (error) {
        this.logger.warn('Failed to parse evaluation event', error);
      }
    });
  }

  onModuleDestroy() {
    this.subscriber.unsubscribe(EVALUATION_EVENTS_CHANNEL);
    this.subscriber.disconnect();
    this.events$.complete();
  }

  streamForJob(jobId: string): Observable<MessageEvent> {
    return this.events$.pipe(
      filter((event) => event.jobId === jobId),
      map((event) => ({ data: event } as MessageEvent))
    );
  }

  streamForEntity(
    entityType: string,
    entityId: string
  ): Observable<MessageEvent> {
    return this.events$.pipe(
      filter(
        (event) =>
          event.entityType === entityType && event.entityId === entityId
      ),
      map((event) => ({ data: event } as MessageEvent))
    );
  }
}
