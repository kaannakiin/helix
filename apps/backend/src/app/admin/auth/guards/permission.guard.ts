import {
  ForbiddenException,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  AUTH_SURFACE_KEY,
  CAPABILITY_KEY,
  IS_PUBLIC_KEY,
  STOREFRONT_AUTH_SURFACE,
} from '@org/constants/auth-constants';
import type { TokenPayload } from '@org/types/token';
import { AuthorizationService } from '../authorization.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authzService: AuthorizationService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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

    const requiredCapability = this.reflector.getAllAndOverride<string>(
      CAPABILITY_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredCapability) {
      return true; // No @RequireCapability decorator → allow (backward compatible)
    }

    const request = context.switchToHttp().getRequest<{
      user?: TokenPayload;
      authzContext?: unknown;
    }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException(
        'backend.errors.auth.insufficient_permissions'
      );
    }

    const authzContext = await this.authzService.resolveContext(user.sub);

    if (!authzContext.capabilities.includes(requiredCapability)) {
      throw new ForbiddenException(
        'backend.errors.auth.insufficient_permissions'
      );
    }

    request.authzContext = authzContext;
    return true;
  }
}
