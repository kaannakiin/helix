import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { AdminModule } from './admin/admin.module';
import { GeolocationModule } from './geolocation/geolocation.module';
import { HttpExceptionI18nFilter } from './i18n/http-exception-i18n.filter';
import { I18nModule } from './i18n/i18n.module';
import { ZodValidationI18nFilter } from './i18n/zod-validation-i18n.filter';
import { CorsOriginService } from '../core/services/cors-origin.service';
import { RequestTimingInterceptor } from '../core/interceptors/request-timing.interceptor';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { StorefrontModule } from './storefront/storefront.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    I18nModule,
    PrismaModule,
    RedisModule,
    AdminModule,
    StorefrontModule,
    GeolocationModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestTimingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionI18nFilter,
    },
    {
      provide: APP_FILTER,
      useClass: ZodValidationI18nFilter,
    },
    CorsOriginService,
  ],
})
export class AppModule {}
