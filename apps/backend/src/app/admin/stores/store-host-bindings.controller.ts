import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequireCapability } from '../../../core/decorators/require-capability.decorator';
import { CAPABILITIES } from '@org/types/authorization';
import { StoreHostBindingDTO } from './dto/index.js';
import { StoreHostBindingsService } from './store-host-bindings.service.js';

@ApiTags('Admin - Store Host Bindings')
@Controller('admin/store-host-bindings')
export class StoreHostBindingsController {
  constructor(
    private readonly storeHostBindingsService: StoreHostBindingsService
  ) {}

  @Get()
  @RequireCapability(CAPABILITIES.STORES_READ)
  @ApiOperation({ summary: 'List store host bindings' })
  async list(@Query('storeId') storeId?: string) {
    return this.storeHostBindingsService.list(storeId);
  }

  @Post()
  @RequireCapability(CAPABILITIES.STORES_WRITE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a store host binding' })
  async create(@Body() body: StoreHostBindingDTO) {
    return this.storeHostBindingsService.create(body);
  }

  @Post(':bindingId/verify-routing')
  @RequireCapability(CAPABILITIES.STORES_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify routing for a store host binding' })
  async verifyRouting(@Param('bindingId') bindingId: string) {
    return this.storeHostBindingsService.verifyRouting(bindingId);
  }

  @Delete(':bindingId')
  @RequireCapability(CAPABILITIES.STORES_WRITE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a store host binding' })
  async delete(@Param('bindingId') bindingId: string) {
    await this.storeHostBindingsService.delete(bindingId);
  }
}
