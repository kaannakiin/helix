import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const REQUIRE_STORE_KEY = 'requireStore';
export const RequireStore = () => SetMetadata(REQUIRE_STORE_KEY, true);

@Injectable()
export class StoreGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<boolean>(REQUIRE_STORE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required) return true;

    const request = context.switchToHttp().getRequest<Record<string, unknown>>();
    if (!request['storeContext']) {
      throw new BadRequestException('backend.errors.store_context_required');
    }

    return true;
  }
}
