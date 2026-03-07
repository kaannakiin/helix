import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import {
  CUSTOMER_JWT_STRATEGY,
  IS_PUBLIC_KEY,
} from '@org/constants/auth-constants';
import type { Observable } from 'rxjs';

@Injectable()
export class CustomerJwtAuthGuard extends AuthGuard(CUSTOMER_JWT_STRATEGY) {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}
