import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@org/prisma/client';
import { Public } from '../../../core/decorators/public.decorator.js';
import { Roles } from '../../../core/decorators/index.js';
import { PlatformInstallationDTO } from './dto/index.js';
import { PlatformInstallationService } from './platform-installation.service.js';

@ApiTags('Admin - Platform Installation')
@Controller('admin/platform-installation')
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
export class PlatformInstallationController {
  constructor(
    private readonly platformInstallationService: PlatformInstallationService
  ) {}

  @Public()
  @Get('config')
  @ApiOperation({ summary: 'Get public platform configuration (locale)' })
  async getPublicConfig() {
    const installation =
      await this.platformInstallationService.findCurrent();
    return { defaultLocale: installation?.defaultLocale ?? 'TR' };
  }

  @Get()
  @ApiOperation({ summary: 'Get current platform installation configuration' })
  async getCurrent() {
    return this.platformInstallationService.findCurrent();
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create or update platform installation configuration' })
  async upsert(@Body() body: PlatformInstallationDTO) {
    return this.platformInstallationService.upsert(body);
  }
}
