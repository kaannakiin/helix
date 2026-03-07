import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { CUSTOMER_LOCAL_STRATEGY } from '@org/constants/auth-constants';
import type { Request } from 'express';
import { Strategy } from 'passport-local';
import { StorefrontAuthService } from '../storefront-auth.service';

@Injectable()
export class CustomerLocalStrategy extends PassportStrategy(
  Strategy,
  CUSTOMER_LOCAL_STRATEGY,
) {
  constructor(private readonly storefrontAuth: StorefrontAuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, _email: string, _password: string) {
    const { email, phone, password } = req.body;
    const storeId = (req as any).__storeId as string;

    if (!storeId) {
      throw new UnauthorizedException('backend.errors.store.not_found');
    }

    const customer = await this.storefrontAuth.validateCredentials(
      storeId,
      email || null,
      phone || null,
      password,
    );

    if (!customer) {
      throw new UnauthorizedException(
        'backend.errors.auth.invalid_credentials',
      );
    }

    return customer;
  }
}
