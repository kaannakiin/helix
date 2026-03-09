import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CUSTOMER_INSTAGRAM_STRATEGY } from '../strategies/customer-instagram.strategy';

@Injectable()
export class CustomerInstagramAuthGuard extends AuthGuard(CUSTOMER_INSTAGRAM_STRATEGY) {}
