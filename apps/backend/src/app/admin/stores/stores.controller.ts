import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { StoreCreateDTO, StoreSaveDTO } from './dto/index.js';
import { StoresService } from './stores.service.js';

@ApiTags('Admin - Stores')
@Controller('admin/stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get()
  @ApiOperation({ summary: 'List all stores' })
  async list() {
    return this.storesService.list();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a store' })
  async create(@Body() body: StoreCreateDTO) {
    return this.storesService.create(body);
  }

  @Get(':storeId')
  @ApiOperation({ summary: 'Get store by ID' })
  async getById(@Param('storeId') storeId: string) {
    return this.storesService.findById(storeId);
  }

  @Patch(':storeId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update store' })
  async update(@Param('storeId') storeId: string, @Body() body: StoreSaveDTO) {
    return this.storesService.update(storeId, body);
  }

  @Delete(':storeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete store' })
  async delete(@Param('storeId') storeId: string) {
    return this.storesService.delete(storeId);
  }
}
