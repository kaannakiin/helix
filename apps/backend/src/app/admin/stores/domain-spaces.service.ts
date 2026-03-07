import { randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DomainOnboardingMode,
  DomainSpaceStatus,
  HostBindingStatus,
  Prisma,
  VerificationStatus,
} from '@org/prisma/client';
import type {
  DomainSpaceOutput,
  DomainSpaceView,
} from '@org/schemas/admin/settings';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  verifyDnsInstructions,
  verifyHttpChallenge,
  verifyTxtRecord,
} from './dns-verification.js';
import { toDomainSpaceView } from './domain-views.js';
import {
  buildApexDnsInstructions,
  buildRoutingChallengeUrl,
  buildWildcardDnsInstructions,
  buildWildcardProbeHostname,
  canAutoActivateBinding,
  getOwnershipLookupHostname,
  hasApexTargets,
  normalizeHostname,
  OWNERSHIP_RECORD_NAME,
  requiresWildcardRouting,
} from './domain-utils.js';
import { HostRoutingService } from './host-routing.service.js';
import { PlatformInstallationService } from './platform-installation.service.js';
import { StorefrontStatusService } from './storefront-status.service.js';

const domainSpaceInclude = {
  include: {
    installation: { include: { ingress: true } },
    hostBindings: {
      select: {
        id: true,
        hostname: true,
        status: true,
        storeId: true,
      },
    },
  },
} satisfies Prisma.DomainSpaceDefaultArgs;

export type DomainSpaceRecord = Prisma.DomainSpaceGetPayload<
  typeof domainSpaceInclude
>;

@Injectable()
export class DomainSpacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformInstallationService: PlatformInstallationService,
    private readonly storefrontStatusService: StorefrontStatusService,
    private readonly hostRoutingService: HostRoutingService
  ) {}

  async list(): Promise<DomainSpaceView[]> {
    const installation = await this.platformInstallationService.findCurrent();
    if (!installation) return [];

    const spaces = await this.prisma.domainSpace.findMany({
      ...domainSpaceInclude,
      where: { installationId: installation.id },
      orderBy: { createdAt: 'asc' },
    });

    return spaces.map((space) => toDomainSpaceView(space));
  }

  async create(data: DomainSpaceOutput): Promise<DomainSpaceView> {
    const installation =
      await this.platformInstallationService.getCurrentOrThrow();

    if (!installation.ingress) {
      throw new BadRequestException('backend.errors.ingress_not_configured');
    }

    const baseDomain = normalizeHostname(data.baseDomain);
    if (baseDomain === installation.portalHostname) {
      throw new ConflictException('backend.errors.host_reserved_for_portal');
    }

    const existing = await this.prisma.domainSpace.findUnique({
      where: { baseDomain },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('backend.errors.domain_space_conflict');
    }

    const ingressTargets = this.platformInstallationService.toIngressTargets(
      installation.ingress
    );
    if (!hasApexTargets(ingressTargets)) {
      throw new BadRequestException('backend.errors.apex_ingress_required');
    }

    const wildcardEnabled = requiresWildcardRouting(data.onboardingMode);

    const created = await this.prisma.domainSpace.create({
      ...domainSpaceInclude,
      data: {
        installationId: installation.id,
        baseDomain,
        onboardingMode: data.onboardingMode,
        status: DomainSpaceStatus.PENDING_OWNERSHIP,
        ownershipMethod: data.ownershipMethod,
        ownershipStatus: VerificationStatus.PENDING,
        ownershipRecordName:
          data.ownershipMethod === 'TXT_TOKEN'
            ? OWNERSHIP_RECORD_NAME
            : null,
        ownershipRecordValue:
          data.ownershipMethod === 'TXT_TOKEN'
            ? this.generateToken()
            : null,
        ownershipVerifiedAt: null,
        ownershipLastError: null,
        apexRoutingMethod: data.apexRoutingMethod,
        apexRoutingStatus: VerificationStatus.PENDING,
        apexChallengeToken:
          data.apexRoutingMethod === 'HTTP_WELL_KNOWN'
            ? this.generateToken()
            : null,
        apexVerifiedAt: null,
        apexRoutingLastError: null,
        wildcardRoutingMethod: data.wildcardRoutingMethod,
        wildcardRoutingStatus: wildcardEnabled
          ? VerificationStatus.PENDING
          : VerificationStatus.SKIPPED,
        wildcardProbeHost: wildcardEnabled
          ? buildWildcardProbeHostname(baseDomain)
          : null,
        wildcardChallengeToken:
          wildcardEnabled && data.wildcardRoutingMethod === 'HTTP_WELL_KNOWN'
            ? this.generateToken()
            : null,
        wildcardVerifiedAt: null,
        wildcardRoutingLastError: null,
      },
    });

    return toDomainSpaceView(created);
  }

  async verifyOwnership(domainSpaceId: string): Promise<DomainSpaceView> {
    const domainSpace = await this.getByIdOrThrow(domainSpaceId);

    if (domainSpace.ownershipStatus === VerificationStatus.VERIFIED) {
      return toDomainSpaceView(domainSpace);
    }

    if (!domainSpace.installation.ingress) {
      throw new BadRequestException('backend.errors.ingress_not_configured');
    }

    const ingressTargets = this.platformInstallationService.toIngressTargets(
      domainSpace.installation.ingress
    );
    const verified =
      domainSpace.ownershipMethod === 'TXT_TOKEN'
        ? await verifyTxtRecord(
            getOwnershipLookupHostname(domainSpace.baseDomain),
            domainSpace.ownershipRecordValue ?? ''
          )
        : await verifyDnsInstructions(
            domainSpace.baseDomain,
            buildApexDnsInstructions(ingressTargets)
          );

    const updated = await this.prisma.domainSpace.update({
      ...domainSpaceInclude,
      where: { id: domainSpace.id },
      data: {
        status: verified ? DomainSpaceStatus.READY : DomainSpaceStatus.FAILED,
        ownershipStatus: verified
          ? VerificationStatus.VERIFIED
          : VerificationStatus.FAILED,
        ownershipVerifiedAt: verified ? new Date() : null,
        ownershipLastError: verified
          ? null
          : domainSpace.ownershipMethod === 'TXT_TOKEN'
            ? 'TXT ownership record does not match the expected token.'
            : 'Domain DNS records do not match the expected ingress targets.',
      },
    });

    if (!verified) {
      await this.hostRoutingService.invalidateHostCachesByDomainSpace(
        updated.id
      );
    }

    return toDomainSpaceView(updated);
  }

  async verifyApexRouting(domainSpaceId: string): Promise<DomainSpaceView> {
    const domainSpace = await this.getByIdOrThrow(domainSpaceId);

    if (domainSpace.ownershipStatus !== VerificationStatus.VERIFIED) {
      throw new BadRequestException('backend.errors.domain_ownership_not_verified');
    }

    if (domainSpace.apexRoutingStatus === VerificationStatus.VERIFIED) {
      return toDomainSpaceView(domainSpace);
    }

    if (!domainSpace.installation.ingress) {
      throw new BadRequestException('backend.errors.ingress_not_configured');
    }

    const ingressTargets = this.platformInstallationService.toIngressTargets(
      domainSpace.installation.ingress
    );
    const verified =
      domainSpace.apexRoutingMethod === 'HTTP_WELL_KNOWN'
        ? await verifyHttpChallenge(
            buildRoutingChallengeUrl(domainSpace.baseDomain),
            domainSpace.apexChallengeToken ?? ''
          )
        : await verifyDnsInstructions(
            domainSpace.baseDomain,
            buildApexDnsInstructions(ingressTargets)
          );

    const updated = await this.prisma.domainSpace.update({
      ...domainSpaceInclude,
      where: { id: domainSpace.id },
      data: {
        apexRoutingStatus: verified
          ? VerificationStatus.VERIFIED
          : VerificationStatus.FAILED,
        apexVerifiedAt: verified ? new Date() : null,
        apexRoutingLastError: verified
          ? null
          : domainSpace.apexRoutingMethod === 'HTTP_WELL_KNOWN'
            ? 'HTTP routing challenge did not return the expected token.'
            : 'Apex DNS records do not match the expected ingress targets.',
      },
    });

    if (verified) {
      await this.activateBindings(updated, 'apex');
      await this.hostRoutingService.invalidateHostCachesByDomainSpace(
        updated.id
      );
      return toDomainSpaceView(await this.getByIdOrThrow(updated.id));
    }

    return toDomainSpaceView(updated);
  }

  async verifyWildcardRouting(domainSpaceId: string): Promise<DomainSpaceView> {
    const domainSpace = await this.getByIdOrThrow(domainSpaceId);

    if (!requiresWildcardRouting(domainSpace.onboardingMode)) {
      throw new BadRequestException('backend.errors.domain_space_wildcard_not_enabled');
    }

    if (domainSpace.ownershipStatus !== VerificationStatus.VERIFIED) {
      throw new BadRequestException('backend.errors.domain_ownership_not_verified');
    }

    if (domainSpace.wildcardRoutingStatus === VerificationStatus.VERIFIED) {
      return toDomainSpaceView(domainSpace);
    }

    if (!domainSpace.installation.ingress) {
      throw new BadRequestException('backend.errors.ingress_not_configured');
    }

    const ingressTargets = this.platformInstallationService.toIngressTargets(
      domainSpace.installation.ingress
    );
    const verified =
      domainSpace.wildcardRoutingMethod === 'HTTP_WELL_KNOWN'
        ? await verifyHttpChallenge(
            buildRoutingChallengeUrl(domainSpace.wildcardProbeHost ?? ''),
            domainSpace.wildcardChallengeToken ?? ''
          )
        : await verifyDnsInstructions(
            domainSpace.wildcardProbeHost ?? '',
            buildWildcardDnsInstructions(domainSpace.baseDomain, ingressTargets)
          );

    const updated = await this.prisma.domainSpace.update({
      ...domainSpaceInclude,
      where: { id: domainSpace.id },
      data: {
        wildcardRoutingStatus: verified
          ? VerificationStatus.VERIFIED
          : VerificationStatus.FAILED,
        wildcardVerifiedAt: verified ? new Date() : null,
        wildcardRoutingLastError: verified
          ? null
          : domainSpace.wildcardRoutingMethod === 'HTTP_WELL_KNOWN'
            ? 'Wildcard HTTP routing challenge did not return the expected token.'
            : 'Wildcard DNS records do not match the expected ingress targets.',
      },
    });

    if (verified) {
      await this.activateBindings(updated, 'wildcard');
      await this.hostRoutingService.invalidateHostCachesByDomainSpace(
        updated.id
      );
      return toDomainSpaceView(await this.getByIdOrThrow(updated.id));
    }

    return toDomainSpaceView(updated);
  }

  async getByIdOrThrow(domainSpaceId: string): Promise<DomainSpaceRecord> {
    const domainSpace = await this.prisma.domainSpace.findUnique({
      ...domainSpaceInclude,
      where: { id: domainSpaceId },
    });

    if (!domainSpace) {
      throw new NotFoundException('backend.errors.domain_space_not_found');
    }

    return domainSpace;
  }

  private async activateBindings(
    domainSpace: DomainSpaceRecord,
    scope: 'apex' | 'wildcard'
  ): Promise<void> {
    const storeIds = new Set<string>();
    const now = new Date();

    for (const binding of domainSpace.hostBindings) {
      if (binding.status === HostBindingStatus.DISABLED) {
        continue;
      }

      const shouldActivate =
        scope === 'apex'
          ? binding.hostname === domainSpace.baseDomain
          : canAutoActivateBinding({
              hostname: binding.hostname,
              baseDomain: domainSpace.baseDomain,
              onboardingMode: domainSpace.onboardingMode,
              apexRoutingStatus: domainSpace.apexRoutingStatus,
              wildcardRoutingStatus: VerificationStatus.VERIFIED,
            }) && binding.hostname !== domainSpace.baseDomain;

      if (!shouldActivate) {
        continue;
      }

      await this.prisma.storeHostBinding.update({
        where: { id: binding.id },
        data: {
          status: HostBindingStatus.ACTIVE,
          routingStatus: VerificationStatus.VERIFIED,
          routingMethod:
            scope === 'apex'
              ? domainSpace.apexRoutingMethod
              : domainSpace.wildcardRoutingMethod,
          challengeToken: null,
          activatedAt: now,
          routingVerifiedAt: now,
          routingLastError: null,
        },
      });

      storeIds.add(binding.storeId);
    }

    await this.storefrontStatusService.syncMany(storeIds);
  }

  private generateToken(): string {
    return randomBytes(24).toString('hex');
  }
}
