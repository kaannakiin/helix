import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { LOCAL_STRATEGY } from '@org/constants/auth-constants';
import type { Request } from 'express';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, LOCAL_STRATEGY) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, _email: string, _password: string) {
    const { email, phone, password } = req.body;

    const user = await this.authService.validateCredentials(
      email || null,
      phone || null,
      password
    );

    if (!user) {
      throw new UnauthorizedException('common.errors.auth.invalid_credentials');
    }

    return user;
  }
}
