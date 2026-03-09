import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import {
  CUSTOMER_JWT_REFRESH_STRATEGY,
  CUSTOMER_REFRESH_COOKIE_NAME,
} from '@org/constants/auth-constants';
import type { CustomerRefreshTokenPayload } from '@org/types/storefront';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { CustomerTokenService } from '../customer-token.service';

@Injectable()
export class CustomerJwtRefreshStrategy extends PassportStrategy(
  Strategy,
  CUSTOMER_JWT_REFRESH_STRATEGY,
) {
  constructor(
    config: ConfigService,
    private readonly customerTokenService: CustomerTokenService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) =>
          req?.cookies?.[CUSTOMER_REFRESH_COOKIE_NAME] ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('CUSTOMER_JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: CustomerRefreshTokenPayload) {
    const refreshToken = req.cookies?.[CUSTOMER_REFRESH_COOKIE_NAME];

    if (!refreshToken) {
      throw new UnauthorizedException(
        'backend.errors.auth.refresh_token_missing',
      );
    }

    const result =
      await this.customerTokenService.validateRefreshToken(refreshToken);

    if (!result) {
      throw new UnauthorizedException(
        'backend.errors.auth.invalid_refresh_token',
      );
    }

    return {
      user: payload,
      refreshToken,
      sessionId: result.sessionId,
      family: result.family,
      tokenId: result.tokenId,
    };
  }
}
