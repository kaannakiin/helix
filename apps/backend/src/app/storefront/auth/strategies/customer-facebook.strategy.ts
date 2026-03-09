import { Inject, Injectable, Optional } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { OAuthProviderConfig } from '@org/prisma/client';
import { Strategy } from 'passport-facebook';
import type { CustomerOAuthProfile } from '../interfaces';

export const CUSTOMER_FACEBOOK_STRATEGY = 'customer-facebook';

@Injectable()
export class CustomerFacebookStrategy extends PassportStrategy(
  Strategy,
  CUSTOMER_FACEBOOK_STRATEGY,
) {
  constructor(
    @Optional() @Inject('OAUTH_FACEBOOK_CONFIG')
    config: OAuthProviderConfig | null,
  ) {
    super({
      clientID: config?.clientId ?? 'disabled',
      clientSecret: config?.clientSecret ?? 'disabled',
      callbackURL: config?.callbackUrl ?? '/storefront/auth/oauth/facebook/callback',
      scope: config?.scopes.length ? config.scopes : ['email', 'public_profile'],
      profileFields: ['id', 'emails', 'name', 'photos'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string | undefined,
    profile: {
      id: string;
      emails?: { value: string }[];
      name?: { givenName?: string; familyName?: string };
      photos?: { value: string }[];
    },
    done: (err: Error | null, user: CustomerOAuthProfile | false) => void,
  ): void {
    const oauthProfile: CustomerOAuthProfile = {
      provider: 'FACEBOOK',
      providerAccountId: profile.id,
      email: profile.emails?.[0]?.value ?? null,
      name: profile.name?.givenName ?? '',
      surname: profile.name?.familyName ?? '',
      avatar: profile.photos?.[0]?.value ?? null,
      emailVerified: false,
      accessToken,
      refreshToken: refreshToken ?? null,
    };

    done(null, oauthProfile);
  }
}
