import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import type { AuthorizationContext } from '@org/types/authorization';
import type Redis from 'ioredis';
import { PrismaService } from '../../prisma/prisma.service';
import { REDIS_CLIENT } from '../../redis/redis.constants.js';

const CACHE_PREFIX = 'authz:user:';
const CACHE_TTL_SECONDS = 300;

@Injectable()
export class AuthorizationService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis
  ) {}

  async resolveContext(userId: string): Promise<AuthorizationContext> {
    const cacheKey = `${CACHE_PREFIX}${userId}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as AuthorizationContext;
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        storeAccess: {
          select: {
            allStores: true,
            stores: { select: { storeId: true } },
          },
        },
        capabilities: {
          select: { capability: true },
        },
      },
    });

    const context: AuthorizationContext = {
      allStores: user.storeAccess?.allStores ?? false,
      storeIds: user.storeAccess?.stores.map((s) => s.storeId) ?? [],
      capabilities: user.capabilities.map((c) => c.capability),
    };

    await this.redis.setex(
      cacheKey,
      CACHE_TTL_SECONDS,
      JSON.stringify(context)
    );

    return context;
  }

  async invalidateContext(userId: string): Promise<void> {
    await this.redis.del(`${CACHE_PREFIX}${userId}`);
  }

  assertStoreAccess(ctx: AuthorizationContext, storeId: string): void {
    if (ctx.allStores) return;
    if (!ctx.storeIds.includes(storeId)) {
      throw new ForbiddenException('backend.errors.auth.no_store_access');
    }
  }
}
