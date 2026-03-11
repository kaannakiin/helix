import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { finalize } from 'rxjs';

@Injectable()
export class RequestTimingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestTimingInterceptor.name);
  private readonly isDevelopment: boolean;
  private readonly slowRequestThresholdMs: number;

  constructor(config: ConfigService) {
    this.isDevelopment = config.get<string>('NODE_ENV') !== 'production';
    this.slowRequestThresholdMs = Number(
      config.get<string>('SLOW_REQUEST_THRESHOLD_MS') ?? '1000'
    );
  }

  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startedAt = performance.now();

    return next.handle().pipe(
      finalize(() => {
        const durationMs = Math.round(performance.now() - startedAt);
        const shouldLog =
          this.isDevelopment || durationMs >= this.slowRequestThresholdMs;

        if (!shouldLog) return;

        this.logger.log(
          `${request.method} ${request.originalUrl} status=${response.statusCode} host=${request.hostname} duration=${durationMs}ms`
        );
      })
    );
  }
}
