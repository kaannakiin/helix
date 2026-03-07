import { randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DomainSpaceStatus,
  HostBindingStatus,
  Prisma,
  VerificationStatus,
} from '@org/prisma/client';
import type {
  StoreHostBindingOutput,
  StoreHostBindingView,
} from '@org/schemas/admin/settings';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  verifyDnsInstructions,
  verifyHttpChallenge,
} from './dns-verification.js';
import { toStoreHostBindingView } from './domain-views.js';
import {
  buildExactHostDnsInstructions,
  buildRoutingChallengeUrl,
  canAutoActivateBinding,
  isApexHostname,
  isHostnameInDomainSpace,
  normalizeHostname,
} from './domain-utils.js';
import { HostRoutingService } from './host-routing.service.js';
import { PlatformInstallationService } from './platform-installation.service.js';
import { StorefrontStatusService } from './storefront-status.service.js';

const storeHostBindingInclude = {
  include: {
    store: {
      select: {
        id: true,
        name: true,
      },
    },
    domainSpace: {
      include: {
        installation: {
          include: {
            ingress: true,
          },
        },
      },
    },
  },
} satisfies Prisma.StoreHostBindingDefaultArgs;

export type StoreHostBindingRecord = Prisma.StoreHostBindingGetPayload<
  typeof storeHostBindingInclude
>;

@Injectable()
export class StoreHostBindingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformInstallationService: PlatformInstallationService,
    private readonly storefrontStatusService: StorefrontStatusService,
    private readonly hostRoutingService: HostRoutingService
  ) {}

  async list(storeId?: string): Promise<StoreHostBindingView[]> {
    const bindings = await this.prisma.storeHostBinding.findMany({
      ...storeHostBindingInclude,
      where: storeId ? { storeId } : undefined,
      orderBy: { createdAt: 'asc' },
    });

    return bindings.map((binding) => toStoreHostBindingView(binding));
  }

  async create(data: StoreHostBindingOutput): Promise<StoreHostBindingView> {
    const hostname = normalizeHostname(data.hostname);
    const installation =
      await this.platformInstallationService.getCurrentOrThrow();

    if (hostname === installation.portalHostname) {
      throw new ConflictException('backend.errors.host_reserved_for_portal');
    }

    const store = await this.prisma.store.findUnique({
      where: { id: data.storeId },
      select: { id: true },
    });
    if (!store) {
      throw new NotFoundException('backend.errors.store_not_found');
    }

    const domainSpace = await this.prisma.domainSpace.findUnique({
      where: { id: data.domainSpaceId },
      include: {
        installation: {
          include: {
            ingress: true,
          },
        },
      },
    });
    if (!domainSpace) {
      throw new NotFoundException('backend.errors.domain_space_not_found');
    }
    if (domainSpace.status !== DomainSpaceStatus.READY) {
      throw new BadRequestException('backend.errors.domain_space_not_active');
    }
    if (domainSpace.ownershipStatus !== VerificationStatus.VERIFIED) {
      throw new BadRequestException(
        'backend.errors.domain_ownership_not_verified'
      );
    }
    if (!domainSpace.installation.ingress) {
      throw new BadRequestException('backend.errors.ingress_not_configured');
    }
    if (!isHostnameInDomainSpace(hostname, domainSpace.baseDomain)) {
      throw new ConflictException('backend.errors.host_outside_domain_space');
    }

    const existing = await this.prisma.storeHostBinding.findUnique({
      where: { hostname },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('backend.errors.store_host_binding_conflict');
    }

    const autoActivate = canAutoActivateBinding({
      hostname,
      baseDomain: domainSpace.baseDomain,
      onboardingMode: domainSpace.onboardingMode,
      apexRoutingStatus: domainSpace.apexRoutingStatus,
      wildcardRoutingStatus: domainSpace.wildcardRoutingStatus,
    });
    const now = autoActivate ? new Date() : null;
    const routingMethod = autoActivate
      ? isApexHostname(hostname, domainSpace.baseDomain)
        ? domainSpace.apexRoutingMethod
        : domainSpace.wildcardRoutingMethod
      : data.routingMethod;

    const binding = await this.prisma.storeHostBinding.create({
      ...storeHostBindingInclude,
      data: {
        storeId: data.storeId,
        domainSpaceId: data.domainSpaceId,
        hostname,
        type: data.type,
        status: autoActivate
          ? HostBindingStatus.ACTIVE
          : HostBindingStatus.PENDING_ROUTING,
        routingMethod,
        routingStatus: autoActivate
          ? VerificationStatus.VERIFIED
          : VerificationStatus.PENDING,
        challengeToken:
          !autoActivate && data.routingMethod === 'HTTP_WELL_KNOWN'
            ? this.generateToken()
            : null,
        activatedAt: now,
        routingVerifiedAt: now,
        routingLastError: null,
      },
    });

    await this.hostRoutingService.invalidateHostCache(hostname);
    await this.storefrontStatusService.syncStore(binding.storeId);
    return toStoreHostBindingView(binding);
  }

  async verifyRouting(bindingId: string): Promise<StoreHostBindingView> {
    const binding = await this.getByIdOrThrow(bindingId);

    if (isApexHostname(binding.hostname, binding.domainSpace.baseDomain)) {
      throw new BadRequestException(
        'backend.errors.domain_apex_verify_required'
      );
    }

    if (binding.routingStatus === VerificationStatus.VERIFIED) {
      return toStoreHostBindingView(binding);
    }

    if (binding.domainSpace.status !== DomainSpaceStatus.READY) {
      throw new BadRequestException('backend.errors.domain_space_not_active');
    }
    if (binding.domainSpace.ownershipStatus !== VerificationStatus.VERIFIED) {
      throw new BadRequestException(
        'backend.errors.domain_ownership_not_verified'
      );
    }
    if (!binding.domainSpace.installation.ingress) {
      throw new BadRequestException('backend.errors.ingress_not_configured');
    }

    const ingressTargets = this.platformInstallationService.toIngressTargets(
      binding.domainSpace.installation.ingress
    );
    const dnsInstructions = buildExactHostDnsInstructions(
      binding.hostname,
      binding.domainSpace.baseDomain,
      ingressTargets
    );

    const verified =
      binding.routingMethod === 'HTTP_WELL_KNOWN'
        ? await verifyHttpChallenge(
            buildRoutingChallengeUrl(binding.hostname),
            binding.challengeToken ?? ''
          )
        : await verifyDnsInstructions(binding.hostname, dnsInstructions);

    const now = verified ? new Date() : null;
    const updated = await this.prisma.storeHostBinding.update({
      ...storeHostBindingInclude,
      where: { id: binding.id },
      data: {
        status: verified ? HostBindingStatus.ACTIVE : HostBindingStatus.FAILED,
        routingStatus: verified
          ? VerificationStatus.VERIFIED
          : VerificationStatus.FAILED,
        activatedAt: verified ? now : null,
        routingVerifiedAt: now,
        routingLastError: verified
          ? null
          : binding.routingMethod === 'HTTP_WELL_KNOWN'
          ? 'HTTP routing challenge did not return the expected token.'
          : 'DNS records do not match the expected ingress targets.',
      },
    });

    await this.hostRoutingService.invalidateHostCache(binding.hostname);
    await this.storefrontStatusService.syncStore(updated.storeId);
    return toStoreHostBindingView(updated);
  }

  async getByIdOrThrow(bindingId: string): Promise<StoreHostBindingRecord> {
    const binding = await this.prisma.storeHostBinding.findUnique({
      ...storeHostBindingInclude,
      where: { id: bindingId },
    });

    if (!binding) {
      throw new NotFoundException(
        'backend.errors.store_host_binding_not_found'
      );
    }

    return binding;
  }

  private generateToken(): string {
    return randomBytes(24).toString('hex');
  }
}
