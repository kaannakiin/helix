import { randomBytes } from 'node:crypto';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InstallationStatus, Prisma, type InstallationIngress } from '@org/prisma/client';
import type { PlatformInstallationOutput } from '@org/schemas/admin/settings';
import { PrismaService } from '../../prisma/prisma.service.js';
import { normalizeHostname, type IngressTargets } from './domain-utils.js';

const platformInstallationInclude = {
  include: { ingress: true },
} satisfies Prisma.PlatformInstallationDefaultArgs;

export type PlatformInstallationRecord = Prisma.PlatformInstallationGetPayload<
  typeof platformInstallationInclude
>;

@Injectable()
export class PlatformInstallationService {
  constructor(private readonly prisma: PrismaService) {}

  async findCurrent(): Promise<PlatformInstallationRecord | null> {
    return this.prisma.platformInstallation.findFirst({
      ...platformInstallationInclude,
      orderBy: { createdAt: 'asc' },
    });
  }

  async getCurrentOrThrow(): Promise<PlatformInstallationRecord> {
    const installation = await this.findCurrent();
    if (!installation) {
      throw new NotFoundException('backend.errors.installation_not_configured');
    }

    return installation;
  }

  async upsert(
    data: PlatformInstallationOutput
  ): Promise<PlatformInstallationRecord> {
    const normalizedPortalHostname = normalizeHostname(data.portalHostname);
    await this.ensurePortalHostnameAvailable(normalizedPortalHostname);

    const existing = await this.findCurrent();
    const tlsAskSecret =
      data.tlsAskSecret ?? existing?.tlsAskSecret ?? randomBytes(24).toString('hex');
    const ingressData = this.buildIngressData(data.ingress);

    if (existing) {
      return this.prisma.platformInstallation.update({
        ...platformInstallationInclude,
        where: { id: existing.id },
        data: {
          name: data.name.trim(),
          portalHostname: normalizedPortalHostname,
          tlsAskSecret,
          status: InstallationStatus.ACTIVE,
          ingress: {
            upsert: {
              create: ingressData,
              update: ingressData,
            },
          },
        },
      });
    }

    return this.prisma.platformInstallation.create({
      ...platformInstallationInclude,
      data: {
        name: data.name.trim(),
        portalHostname: normalizedPortalHostname,
        tlsAskSecret,
        status: InstallationStatus.ACTIVE,
        ingress: {
          create: ingressData,
        },
      },
    });
  }

  toIngressTargets(ingress: InstallationIngress | null | undefined): IngressTargets {
    return {
      canonicalTargetHost: ingress?.canonicalTargetHost
        ? normalizeHostname(ingress.canonicalTargetHost)
        : null,
      ipv4Addresses: ingress?.ipv4Addresses ?? [],
      ipv6Addresses: ingress?.ipv6Addresses ?? [],
    };
  }

  private async ensurePortalHostnameAvailable(portalHostname: string): Promise<void> {
    const binding = await this.prisma.storeHostBinding.findUnique({
      where: { hostname: portalHostname },
      select: { id: true },
    });

    if (binding) {
      throw new ConflictException('backend.errors.host_reserved_for_portal');
    }
  }

  private buildIngressData(data: PlatformInstallationOutput['ingress']) {
    return {
      canonicalTargetHost: data.canonicalTargetHost
        ? normalizeHostname(data.canonicalTargetHost)
        : null,
      ipv4Addresses: [...new Set(data.ipv4Addresses)],
      ipv6Addresses: [...new Set(data.ipv6Addresses)],
    };
  }
}
