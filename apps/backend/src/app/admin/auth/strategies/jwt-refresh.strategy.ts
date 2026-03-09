import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import {
  JWT_REFRESH_STRATEGY,
  REFRESH_TOKEN_COOKIE_NAME,
} from '@org/constants/auth-constants';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { RefreshTokenPayload } from '../token.service';
import { TokenService } from '../token.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  JWT_REFRESH_STRATEGY
) {
  constructor(
    config: ConfigService,
    private readonly tokenService: TokenService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.[REFRESH_TOKEN_COOKIE_NAME] ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: RefreshTokenPayload) {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];

    if (!refreshToken) {
      throw new UnauthorizedException(
        'backend.errors.auth.refresh_token_missing'
      );
    }

    const result = await this.tokenService.validateRefreshToken(refreshToken);

    if (!result) {
      throw new UnauthorizedException(
        'backend.errors.auth.invalid_refresh_token'
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
