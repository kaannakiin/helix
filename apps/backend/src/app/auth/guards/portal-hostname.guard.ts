import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import type Redis from 'ioredis';
import { PrismaService } from '../../prisma/prisma.service.js';
import { REDIS_CLIENT } from '../../redis/redis.constants.js';

const PORTAL_HOSTNAME_KEY = 'platform:portal-hostname';
const PORTAL_HOSTNAME_TTL = 300;

@Injectable()
export class PortalHostnameGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const portalHostname = await this.getPortalHostname();
    if (!portalHostname) return true;
    if (req.hostname === portalHostname) return true;
    throw new ForbiddenException('backend.errors.admin_auth_portal_only');
  }

  private async getPortalHostname(): Promise<string | null> {
    try {
      const cached = await this.redis.get(PORTAL_HOSTNAME_KEY);
      if (cached) return cached;
    } catch {
      /* redis unavailable, fallback to DB */
    }

    const installation = await this.prisma.platformInstallation.findFirst({
      select: { portalHostname: true },
    });
    if (!installation) return null;

    try {
      await this.redis.set(
        PORTAL_HOSTNAME_KEY,
        installation.portalHostname,
        'EX',
        PORTAL_HOSTNAME_TTL,
      );
    } catch {
      /* cache write fail is non-fatal */
    }

    return installation.portalHostname;
  }
}
