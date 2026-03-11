import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@org/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly isDevelopment: boolean;
  private readonly slowQueryThresholdMs: number;

  constructor(config: ConfigService) {
    const isDevelopment = config.get<string>('NODE_ENV') !== 'production';
    const adapter = new PrismaPg({
      connectionString: config.getOrThrow<string>('DATABASE_URL'),
    });
    super({
      adapter,
      omit: {
        user: {
          password: true,
        },
      },
      errorFormat: 'pretty',
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
      ],
      transactionOptions: {
        maxWait: 10000,
        timeout: 10000,
      },
    });

    this.isDevelopment = isDevelopment;
    this.slowQueryThresholdMs = Number(
      config.get<string>('SLOW_QUERY_THRESHOLD_MS') ?? '250'
    );

    (this as PrismaClient & {
      $on(eventType: 'query', callback: (event: any) => void): void;
    }).$on('query', (event) => {
      if (!this.isDevelopment && event.duration < this.slowQueryThresholdMs) {
        return;
      }

      const compactQuery = event.query.replace(/\s+/g, ' ').trim();
      const preview =
        compactQuery.length > 220
          ? `${compactQuery.slice(0, 220)}...`
          : compactQuery;

      console.log(
        `[PrismaQuery] duration=${event.duration}ms target=${event.target ?? 'db'} sql="${preview}" params=${event.params}`
      );
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
