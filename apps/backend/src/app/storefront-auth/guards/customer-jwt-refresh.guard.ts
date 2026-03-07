import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CUSTOMER_JWT_REFRESH_STRATEGY } from '@org/constants/auth-constants';

@Injectable()
export class CustomerJwtRefreshGuard extends AuthGuard(
  CUSTOMER_JWT_REFRESH_STRATEGY,
) {}
