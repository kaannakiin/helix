import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@org/prisma/client';
import { Roles } from '../../../core/decorators/index.js';
import { StoreHostBindingDTO } from './dto/index.js';
import { StoreHostBindingsService } from './store-host-bindings.service.js';

@ApiTags('Admin - Store Host Bindings')
@Controller('admin/store-host-bindings')
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
export class StoreHostBindingsController {
  constructor(
    private readonly storeHostBindingsService: StoreHostBindingsService
  ) {}

  @Get()
  @ApiOperation({ summary: 'List store host bindings' })
  async list(@Query('storeId') storeId?: string) {
    return this.storeHostBindingsService.list(storeId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a store host binding' })
  async create(@Body() body: StoreHostBindingDTO) {
    return this.storeHostBindingsService.create(body);
  }

  @Post(':bindingId/verify-routing')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify routing for a store host binding' })
  async verifyRouting(@Param('bindingId') bindingId: string) {
    return this.storeHostBindingsService.verifyRouting(bindingId);
  }
}
