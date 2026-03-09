import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CUSTOMER_FACEBOOK_STRATEGY } from '../strategies/customer-facebook.strategy';

@Injectable()
export class CustomerFacebookAuthGuard extends AuthGuard(CUSTOMER_FACEBOOK_STRATEGY) {}
