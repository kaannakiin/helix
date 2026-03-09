import { Inject, Injectable, Optional } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { OAuthProviderConfig } from '@org/prisma/client';
import { Strategy } from 'passport-facebook';
import type { CustomerOAuthProfile } from '../interfaces';

export const CUSTOMER_INSTAGRAM_STRATEGY = 'customer-instagram';

@Injectable()
export class CustomerInstagramStrategy extends PassportStrategy(
  Strategy,
  CUSTOMER_INSTAGRAM_STRATEGY,
) {
  constructor(
    @Optional() @Inject('OAUTH_INSTAGRAM_CONFIG')
    config: OAuthProviderConfig | null,
  ) {
    super({
      clientID: config?.clientId ?? 'disabled',
      clientSecret: config?.clientSecret ?? 'disabled',
      callbackURL: config?.callbackUrl ?? '/storefront/auth/oauth/instagram/callback',
      scope: config?.scopes.length ? config.scopes : ['instagram_business_basic'],
      authorizationURL: 'https://api.instagram.com/oauth/authorize',
      tokenURL: 'https://api.instagram.com/oauth/access_token',
      profileURL: 'https://graph.instagram.com/me?fields=id,name,email',
    });
  }

  validate(
    accessToken: string,
    refreshToken: string | undefined,
    profile: {
      id: string;
      displayName?: string;
      emails?: { value: string }[];
      photos?: { value: string }[];
    },
    done: (err: Error | null, user: CustomerOAuthProfile | false) => void,
  ): void {
    const displayName = profile.displayName ?? '';
    const parts = displayName.split(' ');

    const oauthProfile: CustomerOAuthProfile = {
      provider: 'INSTAGRAM',
      providerAccountId: profile.id,
      email: profile.emails?.[0]?.value ?? null,
      name: parts[0] ?? displayName,
      surname: parts.slice(1).join(' '),
      avatar: profile.photos?.[0]?.value ?? null,
      emailVerified: false,
      accessToken,
      refreshToken: refreshToken ?? null,
    };

    done(null, oauthProfile);
  }
}
