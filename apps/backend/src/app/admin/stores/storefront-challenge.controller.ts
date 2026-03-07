import { Controller, Get, Header, Req } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../../../core/decorators/public.decorator.js';
import { HostRoutingService } from './host-routing.service.js';

@ApiExcludeController()
@Controller('.well-known')
export class StorefrontChallengeController {
  constructor(private readonly hostRoutingService: HostRoutingService) {}

  @Public()
  @Get('helix-routing')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  @Header('Cache-Control', 'no-store')
  async challenge(@Req() request: Request) {
    const { token } = await this.hostRoutingService.getRoutingChallenge(
      request.hostname
    );

    return token;
  }
}
