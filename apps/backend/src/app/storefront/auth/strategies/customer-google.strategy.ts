import { Inject, Injectable, Optional } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { OAuthProviderConfig } from '@org/prisma/client';
import { Strategy } from 'passport-google-oauth20';
import type { CustomerOAuthProfile } from '../interfaces';

export const CUSTOMER_GOOGLE_STRATEGY = 'customer-google';

@Injectable()
export class CustomerGoogleStrategy extends PassportStrategy(
  Strategy,
  CUSTOMER_GOOGLE_STRATEGY,
) {
  constructor(
    @Optional() @Inject('OAUTH_GOOGLE_CONFIG')
    config: OAuthProviderConfig | null,
  ) {
    super({
      clientID: config?.clientId ?? 'disabled',
      clientSecret: config?.clientSecret ?? 'disabled',
      callbackURL: config?.callbackUrl ?? '/storefront/auth/oauth/google/callback',
      scope: config?.scopes.length ? config.scopes : ['email', 'profile'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string | undefined,
    profile: {
      id: string;
      emails?: { value: string; verified: boolean }[];
      name?: { givenName?: string; familyName?: string };
      photos?: { value: string }[];
    },
    done: (err: Error | null, user: CustomerOAuthProfile | false) => void,
  ): void {
    const oauthProfile: CustomerOAuthProfile = {
      provider: 'GOOGLE',
      providerAccountId: profile.id,
      email: profile.emails?.[0]?.value ?? null,
      name: profile.name?.givenName ?? '',
      surname: profile.name?.familyName ?? '',
      avatar: profile.photos?.[0]?.value ?? null,
      emailVerified: profile.emails?.[0]?.verified ?? false,
      accessToken,
      refreshToken: refreshToken ?? null,
    };

    done(null, oauthProfile);
  }
}
