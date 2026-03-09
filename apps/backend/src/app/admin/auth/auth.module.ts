import { Module, type Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DeviceService } from './device.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SessionService } from './session.service';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { InstagramStrategy } from './strategies/instagram.strategy';
import { TokenService } from './token.service';

function optionalOAuthProviders(): Provider[] {
  const providers: Provider[] = [];
  if (process.env['GOOGLE_CLIENT_ID']) providers.push(GoogleStrategy);
  if (process.env['FACEBOOK_CLIENT_ID']) providers.push(FacebookStrategy);
  if (process.env['INSTAGRAM_CLIENT_ID']) providers.push(InstagramStrategy);
  return providers;
}

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ session: false }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    SessionService,
    DeviceService,
    LocalStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
    ...optionalOAuthProviders(),
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
