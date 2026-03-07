import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import {
  CUSTOMER_ACCESS_COOKIE_NAME,
  CUSTOMER_JWT_STRATEGY,
} from '@org/constants/auth-constants';
import type { CustomerTokenPayload } from '@org/types/storefront';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class CustomerJwtStrategy extends PassportStrategy(
  Strategy,
  CUSTOMER_JWT_STRATEGY,
) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) =>
          req?.cookies?.[CUSTOMER_ACCESS_COOKIE_NAME] ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('CUSTOMER_JWT_SECRET'),
    });
  }

  async validate(
    payload: CustomerTokenPayload,
  ): Promise<CustomerTokenPayload> {
    if (
      !payload.sub ||
      !payload.sessionId ||
      !payload.storeId ||
      payload.aud !== 'storefront'
    ) {
      throw new UnauthorizedException();
    }
    return payload;
  }
}
