import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Store } from '@org/prisma/client';
import type {
  CreateStoreOutput,
  UpdateStoreOutput,
} from '@org/schemas/admin/settings';
import type Redis from 'ioredis';
import { PrismaService } from '../../prisma/prisma.service.js';
import { REDIS_CLIENT } from '../../redis/redis.constants.js';

const STORE_CACHE_PREFIX = 'store:settings:';
const STORE_CACHE_TTL = 300;

@Injectable()
export class StoresService {
  private readonly logger = new Logger(StoresService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis
  ) {}

  async list(): Promise<Store[]> {
    return this.prisma.store.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(storeId: string): Promise<Store> {
    const cacheKey = `${STORE_CACHE_PREFIX}${storeId}`;

    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) return JSON.parse(cached) as Store;
    } catch (err) {
      this.logger.warn('Redis unavailable, falling back to DB', err);
    }

    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });
    if (!store) throw new NotFoundException('backend.errors.store_not_found');

    try {
      await this.redis.set(
        cacheKey,
        JSON.stringify(store),
        'EX',
        STORE_CACHE_TTL
      );
    } catch (err) {
      this.logger.warn('Failed to cache store', err);
    }

    return store;
  }

  async create(data: CreateStoreOutput): Promise<Store> {
    return this.prisma.store.create({ data });
  }

  async update(storeId: string, data: UpdateStoreOutput): Promise<Store> {
    await this.findById(storeId);

    const updated = await this.prisma.store.update({
      where: { id: storeId },
      data,
    });

    await this.invalidateCache(storeId);
    return updated;
  }

  async delete(storeId: string): Promise<void> {
    await this.findById(storeId);
    await this.prisma.store.delete({ where: { id: storeId } });
    await this.invalidateCache(storeId);
  }

  private async invalidateCache(storeId: string): Promise<void> {
    try {
      await this.redis.del(`${STORE_CACHE_PREFIX}${storeId}`);
    } catch (err) {
      this.logger.warn('Failed to invalidate store cache', err);
    }
  }
}
