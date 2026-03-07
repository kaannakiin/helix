import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../core/decorators/public.decorator.js';
import { HostRoutingService } from './host-routing.service.js';

@ApiTags('Storefront - Hosts')
@Controller('storefront/domains')
export class StorefrontHostsController {
  constructor(private readonly hostRoutingService: HostRoutingService) {}

  @Public()
  @Get('ask')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authorize a hostname for TLS issuance' })
  async ask(@Query('domain') domain: string, @Query('token') token?: string) {
    return this.hostRoutingService.authorizeTlsHost(domain, token);
  }

  @Public()
  @Get('resolve')
  @ApiOperation({ summary: 'Resolve an active storefront hostname' })
  async resolve(@Query('hostname') hostname: string) {
    return this.hostRoutingService.resolveActiveHost(hostname);
  }
}
