import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY, ROLES_KEY } from '@org/constants/auth-constants';
import { UserRole } from '@org/prisma/client';
import type { TokenPayload } from '@org/types/token';

const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.USER]: 0,
  [UserRole.MODERATOR]: 1,
  [UserRole.ADMIN]: 2,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as TokenPayload | undefined;

    if (!user) {
      return false;
    }

    const userLevel = ROLE_HIERARCHY[user.role] ?? 0;
    const minRequiredLevel = Math.min(
      ...requiredRoles.map((role) => ROLE_HIERARCHY[role] ?? 0)
    );

    return userLevel >= minRequiredLevel;
  }
}
