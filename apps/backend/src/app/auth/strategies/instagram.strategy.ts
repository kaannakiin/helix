import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { INSTAGRAM_STRATEGY } from '@org/constants';
import { Strategy, type Profile } from 'passport-facebook';
import type { OAuthProfile } from '../interfaces';

@Injectable()
export class InstagramStrategy extends PassportStrategy(Strategy, INSTAGRAM_STRATEGY) {
  constructor(config: ConfigService) {
    super({
      clientID: config.getOrThrow<string>('INSTAGRAM_CLIENT_ID'),
      clientSecret: config.getOrThrow<string>('INSTAGRAM_CLIENT_SECRET'),
      callbackURL: config.getOrThrow<string>('INSTAGRAM_CALLBACK_URL'),
      authorizationURL: 'https://api.instagram.com/oauth/authorize',
      tokenURL: 'https://api.instagram.com/oauth/access_token',
      scope: ['instagram_basic'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: Error | null, user?: OAuthProfile | false) => void,
  ): Promise<void> {
    const oauthProfile: OAuthProfile = {
      provider: 'INSTAGRAM',
      providerAccountId: profile.id,
      email: null,
      name: profile.username ?? profile.displayName ?? '',
      surname: '',
      avatar: profile.photos?.[0]?.value ?? null,
      emailVerified: false,
      accessToken,
      refreshToken: refreshToken ?? null,
    };

    done(null, oauthProfile);
  }
}
