import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { RedisModule } from '../../redis/redis.module.js';
import { StoreGuard } from './store.guard.js';
import { StoresController } from './stores.controller.js';
import { StoresService } from './stores.service.js';

@Global()
@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [StoresController],
  providers: [StoresService, StoreGuard],
  exports: [StoresService, StoreGuard],
})
export class StoresModule {}
