import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FACEBOOK_STRATEGY } from '@org/constants';

@Injectable()
export class FacebookAuthGuard extends AuthGuard(FACEBOOK_STRATEGY) {}
