import { timingSafeEqual } from 'node:crypto';
import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  DomainSpaceStatus,
  HostBindingStatus,
  InstallationStatus,
  Prisma,
  StoreStatus,
  VerificationStatus,
} from '@org/prisma/client';
import type Redis from 'ioredis';
import { PrismaService } from '../../prisma/prisma.service.js';
import { REDIS_CLIENT } from '../../redis/redis.constants.js';
import { normalizeHostname } from './domain-utils.js';
import { PlatformInstallationService } from './platform-installation.service.js';

const HOST_CACHE_PREFIX = 'storefront:host:';
const HOST_CACHE_TTL = 300;
const STORE_HOSTS_PREFIX = 'storefront:store:';
const STORE_HOSTS_SUFFIX = ':hosts';

const storefrontResolutionInclude = {
  include: {
    store: true,
    domainSpace: true,
  },
} satisfies Prisma.StoreHostBindingDefaultArgs;

export type StorefrontResolutionRecord = Prisma.StoreHostBindingGetPayload<
  typeof storefrontResolutionInclude
>;

@Injectable()
export class HostRoutingService {
  private readonly logger = new Logger(HostRoutingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly platformInstallationService: PlatformInstallationService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis
  ) {}

  async authorizeTlsHost(hostname: string, token?: string): Promise<{
    authorized: true;
  }> {
    const installation =
      await this.platformInstallationService.getCurrentOrThrow();

    if (installation.status !== InstallationStatus.ACTIVE) {
      throw new ForbiddenException('backend.errors.tls_host_not_authorized');
    }

    if (!this.matchesSecret(installation.tlsAskSecret, token)) {
      throw new UnauthorizedException('backend.errors.tls_secret_invalid');
    }

    const normalizedHostname = normalizeHostname(hostname);
    if (normalizedHostname === installation.portalHostname) {
      throw new ForbiddenException('backend.errors.tls_host_not_authorized');
    }

    if (
      (await this.hasActiveBinding(normalizedHostname)) ||
      (await this.hasPendingDomainChallenge(normalizedHostname)) ||
      (await this.hasPendingBindingChallenge(normalizedHostname))
    ) {
      return { authorized: true };
    }

    throw new ForbiddenException('backend.errors.tls_host_not_authorized');
  }

  async resolveActiveHost(hostname: string): Promise<StorefrontResolutionRecord> {
    const installation =
      await this.platformInstallationService.getCurrentOrThrow();
    const normalizedHostname = normalizeHostname(hostname);

    if (normalizedHostname === installation.portalHostname) {
      throw new NotFoundException('backend.errors.host_resolution_not_found');
    }

    const cacheKey = `${HOST_CACHE_PREFIX}${normalizedHostname}`;

    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) return JSON.parse(cached) as StorefrontResolutionRecord;
    } catch (err) {
      this.logger.warn('Redis unavailable for host cache read', err);
    }

    const binding = await this.prisma.storeHostBinding.findFirst({
      ...storefrontResolutionInclude,
      where: {
        hostname: normalizedHostname,
        status: HostBindingStatus.ACTIVE,
        domainSpace: {
          status: DomainSpaceStatus.READY,
        },
        store: {
          status: StoreStatus.ACTIVE,
        },
      },
    });

    if (!binding) {
      throw new NotFoundException('backend.errors.host_resolution_not_found');
    }

    try {
      const storeHostsKey = `${STORE_HOSTS_PREFIX}${binding.storeId}${STORE_HOSTS_SUFFIX}`;
      const pipe = this.redis.pipeline();
      pipe.set(cacheKey, JSON.stringify(binding), 'EX', HOST_CACHE_TTL);
      pipe.sadd(storeHostsKey, normalizedHostname);
      await pipe.exec();
    } catch (err) {
      this.logger.warn('Failed to cache host resolution', err);
    }

    return binding;
  }

  async getRoutingChallenge(hostname: string): Promise<{ token: string }> {
    const installation =
      await this.platformInstallationService.getCurrentOrThrow();
    const normalizedHostname = normalizeHostname(hostname);

    if (normalizedHostname === installation.portalHostname) {
      throw new NotFoundException('backend.errors.host_resolution_not_found');
    }

    const binding = await this.prisma.storeHostBinding.findFirst({
      where: {
        hostname: normalizedHostname,
        routingMethod: 'HTTP_WELL_KNOWN',
        challengeToken: { not: null },
        status: {
          in: [
            HostBindingStatus.PENDING_ROUTING,
            HostBindingStatus.FAILED,
            HostBindingStatus.ACTIVE,
          ],
        },
        domainSpace: {
          status: DomainSpaceStatus.READY,
          ownershipStatus: VerificationStatus.VERIFIED,
        },
        store: {
          status: StoreStatus.ACTIVE,
        },
      },
      select: { challengeToken: true },
    });

    if (binding?.challengeToken) {
      return { token: binding.challengeToken };
    }

    const domainSpace = await this.prisma.domainSpace.findFirst({
      where: {
        status: DomainSpaceStatus.READY,
        ownershipStatus: VerificationStatus.VERIFIED,
        OR: [
          {
            baseDomain: normalizedHostname,
            apexRoutingMethod: 'HTTP_WELL_KNOWN',
            apexChallengeToken: { not: null },
          },
          {
            wildcardProbeHost: normalizedHostname,
            wildcardRoutingMethod: 'HTTP_WELL_KNOWN',
            wildcardChallengeToken: { not: null },
          },
        ],
      },
      select: {
        baseDomain: true,
        apexChallengeToken: true,
        wildcardProbeHost: true,
        wildcardChallengeToken: true,
      },
    });

    if (!domainSpace) {
      throw new NotFoundException('backend.errors.host_resolution_not_found');
    }

    if (
      domainSpace.baseDomain === normalizedHostname &&
      domainSpace.apexChallengeToken
    ) {
      return { token: domainSpace.apexChallengeToken };
    }

    if (
      domainSpace.wildcardProbeHost === normalizedHostname &&
      domainSpace.wildcardChallengeToken
    ) {
      return { token: domainSpace.wildcardChallengeToken };
    }

    throw new NotFoundException('backend.errors.host_resolution_not_found');
  }

  async invalidateHostCache(hostname: string): Promise<void> {
    try {
      await this.redis.del(`${HOST_CACHE_PREFIX}${hostname}`);
    } catch (err) {
      this.logger.warn('Failed to invalidate host cache', err);
    }
  }

  async invalidateHostCachesByStoreId(storeId: string): Promise<void> {
    try {
      const setKey = `${STORE_HOSTS_PREFIX}${storeId}${STORE_HOSTS_SUFFIX}`;
      const hostnames = await this.redis.smembers(setKey);
      if (hostnames.length === 0) return;

      const pipe = this.redis.pipeline();
      for (const h of hostnames) {
        pipe.del(`${HOST_CACHE_PREFIX}${h}`);
      }
      pipe.del(setKey);
      await pipe.exec();
    } catch (err) {
      this.logger.warn('Failed to invalidate host caches by store', err);
    }
  }

  async invalidateHostCachesByDomainSpace(
    domainSpaceId: string
  ): Promise<void> {
    try {
      const bindings = await this.prisma.storeHostBinding.findMany({
        where: { domainSpaceId },
        select: { hostname: true, storeId: true },
      });
      if (bindings.length === 0) return;

      const pipe = this.redis.pipeline();
      for (const b of bindings) {
        pipe.del(`${HOST_CACHE_PREFIX}${b.hostname}`);
        pipe.srem(
          `${STORE_HOSTS_PREFIX}${b.storeId}${STORE_HOSTS_SUFFIX}`,
          b.hostname
        );
      }
      await pipe.exec();
    } catch (err) {
      this.logger.warn(
        'Failed to invalidate host caches by domain space',
        err
      );
    }
  }

  private async hasActiveBinding(hostname: string): Promise<boolean> {
    const binding = await this.prisma.storeHostBinding.findFirst({
      where: {
        hostname,
        status: HostBindingStatus.ACTIVE,
        domainSpace: {
          status: DomainSpaceStatus.READY,
        },
        store: {
          status: StoreStatus.ACTIVE,
        },
      },
      select: { id: true },
    });

    return Boolean(binding);
  }

  private async hasPendingDomainChallenge(hostname: string): Promise<boolean> {
    const domainSpace = await this.prisma.domainSpace.findFirst({
      where: {
        status: DomainSpaceStatus.READY,
        ownershipStatus: VerificationStatus.VERIFIED,
        OR: [
          {
            baseDomain: hostname,
            apexRoutingMethod: 'HTTP_WELL_KNOWN',
            apexRoutingStatus: {
              in: [VerificationStatus.PENDING, VerificationStatus.FAILED],
            },
            apexChallengeToken: { not: null },
          },
          {
            wildcardProbeHost: hostname,
            wildcardRoutingMethod: 'HTTP_WELL_KNOWN',
            wildcardRoutingStatus: {
              in: [VerificationStatus.PENDING, VerificationStatus.FAILED],
            },
            wildcardChallengeToken: { not: null },
          },
        ],
      },
      select: { id: true },
    });

    return Boolean(domainSpace);
  }

  private async hasPendingBindingChallenge(hostname: string): Promise<boolean> {
    const binding = await this.prisma.storeHostBinding.findFirst({
      where: {
        hostname,
        routingMethod: 'HTTP_WELL_KNOWN',
        challengeToken: { not: null },
        status: {
          in: [HostBindingStatus.PENDING_ROUTING, HostBindingStatus.FAILED],
        },
        domainSpace: {
          status: DomainSpaceStatus.READY,
          ownershipStatus: VerificationStatus.VERIFIED,
        },
        store: {
          status: StoreStatus.ACTIVE,
        },
      },
      select: { id: true },
    });

    return Boolean(binding);
  }

  private matchesSecret(expected: string, received?: string): boolean {
    if (!received) return false;

    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(received);
    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, receivedBuffer);
  }
}
