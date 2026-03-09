import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaService } from '../../prisma/prisma.service';
import { CustomerDeviceService } from './customer-device.service';
import { CustomerSessionService } from './customer-session.service';
import { CustomerTokenService } from './customer-token.service';
import { CustomerFacebookAuthGuard } from './guards/customer-facebook-auth.guard';
import { CustomerGoogleAuthGuard } from './guards/customer-google-auth.guard';
import { CustomerInstagramAuthGuard } from './guards/customer-instagram-auth.guard';
import { CustomerJwtAuthGuard } from './guards/customer-jwt-auth.guard';
import { CustomerJwtRefreshGuard } from './guards/customer-jwt-refresh.guard';
import { StoreScopeGuard } from './guards/store-scope.guard';
import { StorefrontAuthController } from './storefront-auth.controller';
import { StorefrontAuthService } from './storefront-auth.service';
import { CustomerFacebookStrategy } from './strategies/customer-facebook.strategy';
import { CustomerGoogleStrategy } from './strategies/customer-google.strategy';
import { CustomerInstagramStrategy } from './strategies/customer-instagram.strategy';
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
    CustomerGoogleAuthGuard,
    CustomerFacebookAuthGuard,
    CustomerInstagramAuthGuard,
    StoreScopeGuard,

    {
      provide: 'OAUTH_GOOGLE_CONFIG',
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) =>
        prisma.oAuthProviderConfig.findUnique({
          where: { provider: 'GOOGLE' },
        }),
    },

    {
      provide: 'OAUTH_FACEBOOK_CONFIG',
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) =>
        prisma.oAuthProviderConfig.findUnique({
          where: { provider: 'FACEBOOK' },
        }),
    },

    {
      provide: 'OAUTH_INSTAGRAM_CONFIG',
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) =>
        prisma.oAuthProviderConfig.findUnique({
          where: { provider: 'INSTAGRAM' },
        }),
    },
    CustomerGoogleStrategy,
    CustomerFacebookStrategy,
    CustomerInstagramStrategy,
  ],
  exports: [StorefrontAuthService],
})
export class StorefrontAuthModule {}
