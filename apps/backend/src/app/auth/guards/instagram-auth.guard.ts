import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { INSTAGRAM_STRATEGY } from '@org/constants';

@Injectable()
export class InstagramAuthGuard extends AuthGuard(INSTAGRAM_STRATEGY) {}
