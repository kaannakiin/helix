import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CUSTOMER_GOOGLE_STRATEGY } from '../strategies/customer-google.strategy';

@Injectable()
export class CustomerGoogleAuthGuard extends AuthGuard(CUSTOMER_GOOGLE_STRATEGY) {}
