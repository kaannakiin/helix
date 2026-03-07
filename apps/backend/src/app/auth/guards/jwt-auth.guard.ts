import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import {
  AUTH_SURFACE_KEY,
  IS_PUBLIC_KEY,
  JWT_STRATEGY,
  STOREFRONT_AUTH_SURFACE,
} from '@org/constants/auth-constants';
import type { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard(JWT_STRATEGY) {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const authSurface = this.reflector.getAllAndOverride<string>(
      AUTH_SURFACE_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (isPublic || authSurface === STOREFRONT_AUTH_SURFACE) {
      return true;
    }

    return super.canActivate(context);
  }
}
