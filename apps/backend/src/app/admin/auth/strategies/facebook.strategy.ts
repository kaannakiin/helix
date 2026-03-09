import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { FACEBOOK_STRATEGY } from '@org/constants/auth-constants';
import { Strategy, type Profile } from 'passport-facebook';
import type { OAuthProfile } from '../interfaces';

@Injectable()
export class FacebookStrategy extends PassportStrategy(
  Strategy,
  FACEBOOK_STRATEGY
) {
  constructor(config: ConfigService) {
    super({
      clientID: config.getOrThrow<string>('FACEBOOK_CLIENT_ID'),
      clientSecret: config.getOrThrow<string>('FACEBOOK_CLIENT_SECRET'),
      callbackURL: config.getOrThrow<string>('FACEBOOK_CALLBACK_URL'),
      profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
      scope: ['email', 'public_profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: Error | null, user?: OAuthProfile | false) => void
  ): Promise<void> {
    const email = profile.emails?.[0]?.value ?? null;

    const oauthProfile: OAuthProfile = {
      provider: 'FACEBOOK',
      providerAccountId: profile.id,
      email,
      name: profile.name?.givenName ?? profile.displayName ?? '',
      surname: profile.name?.familyName ?? '',
      avatar: profile.photos?.[0]?.value ?? null,
      emailVerified: !!email,
      accessToken,
      refreshToken: refreshToken ?? null,
    };

    done(null, oauthProfile);
  }
}
