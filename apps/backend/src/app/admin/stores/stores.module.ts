import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { RedisModule } from '../../redis/redis.module.js';
import { DomainSpacesController } from './domain-spaces.controller.js';
import { DomainSpacesService } from './domain-spaces.service.js';
import { HostRoutingService } from './host-routing.service.js';
import { PlatformInstallationController } from './platform-installation.controller.js';
import { PlatformInstallationService } from './platform-installation.service.js';
import { StoreHostBindingsController } from './store-host-bindings.controller.js';
import { StoreHostBindingsService } from './store-host-bindings.service.js';
import { StoreGuard } from './store.guard.js';
import { StorefrontChallengeController } from './storefront-challenge.controller.js';
import { StorefrontHostsController } from './storefront-hosts.controller.js';
import { StorefrontStatusService } from './storefront-status.service.js';
import { StoresController } from './stores.controller.js';
import { StoresService } from './stores.service.js';

@Global()
@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [
    StoresController,
    PlatformInstallationController,
    DomainSpacesController,
    StoreHostBindingsController,
    StorefrontHostsController,
    StorefrontChallengeController,
  ],
  providers: [
    StoresService,
    StoreGuard,
    StorefrontStatusService,
    PlatformInstallationService,
    DomainSpacesService,
    StoreHostBindingsService,
    HostRoutingService,
  ],
  exports: [
    StoresService,
    StoreGuard,
    HostRoutingService,
    PlatformInstallationService,
  ],
})
export class StoresModule {}
