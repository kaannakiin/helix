import { Injectable } from '@nestjs/common';
import { HostBindingStatus, StorefrontStatus } from '@org/prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { HostRoutingService } from './host-routing.service.js';
import { StoresService } from './stores.service.js';

@Injectable()
export class StorefrontStatusService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storesService: StoresService,
    private readonly hostRoutingService: HostRoutingService
  ) {}

  async syncStore(storeId: string): Promise<void> {
    const activeBindingCount = await this.prisma.storeHostBinding.count({
      where: {
        storeId,
        status: HostBindingStatus.ACTIVE,
      },
    });

    await this.prisma.store.update({
      where: { id: storeId },
      data: {
        storefrontStatus:
          activeBindingCount > 0
            ? StorefrontStatus.ACTIVE
            : StorefrontStatus.PENDING_HOST,
      },
    });

    await this.storesService.invalidateStoreCache(storeId);
    await this.hostRoutingService.invalidateHostCachesByStoreId(storeId);
  }

  async syncMany(storeIds: Iterable<string>): Promise<void> {
    const uniqueStoreIds = [...new Set(storeIds)];

    for (const storeId of uniqueStoreIds) {
      await this.syncStore(storeId);
    }
  }
}
