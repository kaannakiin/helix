import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FACEBOOK_STRATEGY } from '@org/constants/auth-constants';

@Injectable()
export class FacebookAuthGuard extends AuthGuard(FACEBOOK_STRATEGY) {}
