import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { GOOGLE_STRATEGY } from '@org/constants/auth-constants';
import {
  Strategy,
  type Profile,
  type VerifyCallback,
} from 'passport-google-oauth20';
import type { OAuthProfile } from '../interfaces';

@Injectable()
export class GoogleStrategy extends PassportStrategy(
  Strategy,
  GOOGLE_STRATEGY
) {
  constructor(config: ConfigService) {
    super({
      clientID: config.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: config.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: config.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback
  ): Promise<void> {
    const email = profile.emails?.[0]?.value ?? null;
    const emailVerified = profile.emails?.[0]?.verified === true;

    const oauthProfile: OAuthProfile = {
      provider: 'GOOGLE',
      providerAccountId: profile.id,
      email,
      name: profile.name?.givenName ?? profile.displayName ?? '',
      surname: profile.name?.familyName ?? '',
      avatar: profile.photos?.[0]?.value ?? null,
      emailVerified,
      accessToken,
      refreshToken: refreshToken ?? null,
    };

    done(null, oauthProfile);
  }
}
