import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { EvaluationModule } from './evaluation/evaluation.module';
import { GeolocationModule } from './geolocation/geolocation.module';
import { HttpExceptionI18nFilter } from './i18n/http-exception-i18n.filter';
import { I18nModule } from './i18n/i18n.module';
import { ZodValidationI18nFilter } from './i18n/zod-validation-i18n.filter';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    I18nModule,
    PrismaModule,
    AuthModule,
    AdminModule,
    EvaluationModule,
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
      provide: APP_FILTER,
      useClass: HttpExceptionI18nFilter,
    },
    {
      provide: APP_FILTER,
      useClass: ZodValidationI18nFilter,
    },
  ],
})
export class AppModule {}
