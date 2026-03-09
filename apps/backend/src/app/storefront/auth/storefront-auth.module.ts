import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../../prisma/prisma.module';
import { CustomerDeviceService } from './customer-device.service';
import { CustomerSessionService } from './customer-session.service';
import { CustomerTokenService } from './customer-token.service';
import { CustomerJwtAuthGuard } from './guards/customer-jwt-auth.guard';
import { CustomerJwtRefreshGuard } from './guards/customer-jwt-refresh.guard';
import { StoreScopeGuard } from './guards/store-scope.guard';
import { StorefrontAuthController } from './storefront-auth.controller';
import { StorefrontAuthService } from './storefront-auth.service';
import { CustomerJwtRefreshStrategy } from './strategies/customer-jwt-refresh.strategy';
import { CustomerJwtStrategy } from './strategies/customer-jwt.strategy';
import { CustomerLocalStrategy } from './strategies/customer-local.strategy';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ session: false }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('CUSTOMER_JWT_SECRET'),
      }),
    }),
  ],
  controllers: [StorefrontAuthController],
  providers: [
    StorefrontAuthService,
    CustomerTokenService,
    CustomerSessionService,
    CustomerDeviceService,
    CustomerJwtStrategy,
    CustomerJwtRefreshStrategy,
    CustomerLocalStrategy,
    CustomerJwtAuthGuard,
    CustomerJwtRefreshGuard,
    StoreScopeGuard,
  ],
  exports: [StorefrontAuthService],
})
export class StorefrontAuthModule {}
