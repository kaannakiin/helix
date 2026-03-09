import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type {
  CustomerRefreshTokenPayload,
  CustomerTokenPayload,
} from '@org/types/storefront';
import { HostRoutingService } from '../../../admin/stores/host-routing.service';
import type { CustomerRefreshTokenContext } from '../interfaces';

@Injectable()
export class StoreScopeGuard implements CanActivate {
  constructor(private readonly hostRouting: HostRoutingService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authContext = request.user as
      | CustomerRefreshTokenContext
      | CustomerTokenPayload
      | undefined;
    const customer = this.getCustomerPayload(authContext);

    if (!customer?.storeId) {
      throw new UnauthorizedException();
    }

    const resolution = await this.hostRouting.resolveActiveHost(
      request.hostname,
    );

    if (resolution.storeId !== customer.storeId) {
      throw new ForbiddenException();
    }

    return true;
  }

  private getCustomerPayload(
    authContext?: CustomerRefreshTokenContext | CustomerTokenPayload
  ): CustomerTokenPayload | CustomerRefreshTokenPayload | undefined {
    if (!authContext) {
      return undefined;
    }

    if ('user' in authContext) {
      return authContext.user;
    }

    return authContext;
  }
}
