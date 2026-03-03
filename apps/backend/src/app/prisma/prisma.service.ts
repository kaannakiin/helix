import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@org/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(config: ConfigService) {
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
      log: ['error', 'warn'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
