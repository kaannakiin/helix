import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LOCAL_STRATEGY } from '@org/constants/auth-constants';

@Injectable()
export class LocalAuthGuard extends AuthGuard(LOCAL_STRATEGY) {}
