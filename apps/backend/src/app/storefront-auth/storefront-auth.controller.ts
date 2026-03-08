import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { CustomerTokenPayload } from '@org/types/storefront';
import { STOREFRONT_AUTH_SURFACE } from '@org/constants/auth-constants';
import type { DeviceType } from '@org/prisma/client';
import type { Request, Response } from 'express';
import { UAParser } from 'ua-parser-js';
import { AuthSurface, Public } from '../../core/decorators';
import { HostRoutingService } from '../admin/stores/host-routing.service';
import { CustomerJwtRefreshGuard } from './guards/customer-jwt-refresh.guard';
import { StoreScopeGuard } from './guards/store-scope.guard';
import type {
  AuthenticatedCustomerRefreshRequest,
  AuthenticatedCustomerRequest,
  CustomerRefreshTokenContext,
  CustomerRequestMetadata,
} from './interfaces';
import { StorefrontAuthService } from './storefront-auth.service';
import { CustomerJwtAuthGuard } from './guards/customer-jwt-auth.guard';

@ApiTags('Storefront - Auth')
@Controller('storefront/auth')
@AuthSurface(STOREFRONT_AUTH_SURFACE)
@UseGuards(CustomerJwtAuthGuard)
export class StorefrontAuthController {
  constructor(
    private readonly storefrontAuth: StorefrontAuthService,
    private readonly hostRouting: HostRoutingService,
  ) {}

  @Public()
  @Post('register')
  async register(
    @Body() body: { name: string; surname: string; email?: string; phone?: string; password: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const storeId = await this.resolveStoreId(req);
    const metadata = this.extractMetadata(req);

    return this.storefrontAuth.register(storeId, body, metadata, res, req.hostname);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: { email?: string; phone?: string; password: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const storeId = await this.resolveStoreId(req);
    const metadata = this.extractMetadata(req);

    const customer = await this.storefrontAuth.validateCredentials(
      storeId,
      body.email || null,
      body.phone || null,
      body.password,
    );

    if (!customer) {
      const { UnauthorizedException } = await import('@nestjs/common');
      throw new UnauthorizedException(
        'backend.errors.auth.invalid_credentials',
      );
    }

    return this.storefrontAuth.login(customer, metadata, res, req.hostname);
  }

  @Public()
  @Post('refresh')
  @UseGuards(CustomerJwtRefreshGuard, StoreScopeGuard)
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: AuthenticatedCustomerRefreshRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const context = req.user as CustomerRefreshTokenContext;

    return this.storefrontAuth.refreshTokens(
      {
        user: context.user,
        sessionId: context.sessionId,
        family: context.family,
        tokenId: context.tokenId,
      },
      res,
      req.hostname,
    );
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(StoreScopeGuard)
  async logout(
    @Req() req: AuthenticatedCustomerRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user as CustomerTokenPayload;

    return this.storefrontAuth.logout(user.sub, user.sessionId, res, req.hostname);
  }

  @Get('me')
  @UseGuards(StoreScopeGuard)
  async me(@Req() req: AuthenticatedCustomerRequest) {
    const user = req.user as CustomerTokenPayload;
    return this.storefrontAuth.getProfile(user.sub);
  }

  private async resolveStoreId(req: Request): Promise<string> {
    const resolution = await this.hostRouting.resolveActiveHost(req.hostname);
    return resolution.storeId;
  }

  private extractMetadata(req: Request): CustomerRequestMetadata {
    const ua = new UAParser(req.headers['user-agent'] ?? '');
    const browser = ua.getBrowser();
    const os = ua.getOS();
    const device = ua.getDevice();

    const deviceTypeMap: Record<string, DeviceType> = {
      mobile: 'MOBILE',
      tablet: 'TABLET',
      console: 'DESKTOP',
      smarttv: 'DESKTOP',
    };

    return {
      ipAddress: (req.ip || req.socket.remoteAddress) ?? 'unknown',
      userAgent: req.headers['user-agent'] ?? 'unknown',
      browserName: browser.name,
      browserVersion: browser.version,
      osName: os.name,
      osVersion: os.version,
      deviceType: deviceTypeMap[device.type ?? ''] ?? 'DESKTOP',
      fingerprint: `${browser.name ?? ''}-${os.name ?? ''}-${device.type ?? 'desktop'}`,
    };
  }
}
