import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { RedisModule } from '../../redis/redis.module.js';
import { StoreContextInterceptor } from './store-context.interceptor.js';
import { StoreGuard } from './store.guard.js';
import { StoresController } from './stores.controller.js';
import { StoresService } from './stores.service.js';

@Global()
@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [StoresController],
  providers: [StoresService, StoreContextInterceptor, StoreGuard],
  exports: [StoresService, StoreContextInterceptor, StoreGuard],
})
export class StoresModule {}
