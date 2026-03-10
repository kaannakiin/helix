import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../app/prisma/prisma.service';

@Injectable()
export class CorsOriginService {
  private allowedHostnames: Set<string> | null = null;
  private lastRefresh = 0;
  private readonly TTL = 60_000;

  constructor(private readonly prisma: PrismaService) {}

  async isAllowedOrigin(hostname: string): Promise<boolean> {
    await this.refreshIfStale();
    return this.allowedHostnames!.has(hostname);
  }

  private async refreshIfStale(): Promise<void> {
    if (this.allowedHostnames && Date.now() - this.lastRefresh < this.TTL) {
      return;
    }

    const installation = await this.prisma.platformInstallation.findFirst({
      select: { portalHostname: true },
    });

    const activeBindings = await this.prisma.storeHostBinding.findMany({
      where: { status: 'ACTIVE' },
      select: { hostname: true },
    });

    const hostnames = new Set<string>();
    if (installation) hostnames.add(installation.portalHostname);
    for (const b of activeBindings) hostnames.add(b.hostname);

    this.allowedHostnames = hostnames;
    this.lastRefresh = Date.now();
  }
}
