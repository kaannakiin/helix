import {
  BadRequestException,
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
import {
  StoreCurrencyCreateDTO,
  StoreCurrencyUpdateDTO,
} from './dto/index.js';
import { StoreCurrenciesService } from './store-currencies.service.js';
import { StoresService } from './stores.service.js';

@ApiTags('Admin - Store Currencies')
@Controller('admin/stores/:storeId/currencies')
export class StoreCurrenciesController {
  constructor(
    private readonly service: StoreCurrenciesService,
    private readonly storesService: StoresService
  ) {}

  @Get()
  @ApiOperation({ summary: 'List currencies for a store' })
  async list(@Param('storeId') storeId: string) {
    return this.service.list(storeId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a currency to a store' })
  async create(
    @Param('storeId') storeId: string,
    @Body() body: StoreCurrencyCreateDTO
  ) {
    return this.service.create(storeId, body);
  }

  @Patch(':currencyId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update store currency policy' })
  async update(
    @Param('storeId') storeId: string,
    @Param('currencyId') currencyId: string,
    @Body() body: StoreCurrencyUpdateDTO
  ) {
    return this.service.update(storeId, currencyId, body);
  }

  @Delete(':currencyId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a currency from a store' })
  async delete(
    @Param('storeId') storeId: string,
    @Param('currencyId') currencyId: string
  ) {
    const store = await this.storesService.findById(storeId);
    const currency = await this.service.findOne(storeId, currencyId);
    if (currency.currencyCode === store.defaultCurrencyCode) {
      throw new BadRequestException(
        'backend.errors.store_currency_default_cannot_delete'
      );
    }
    return this.service.delete(storeId, currencyId);
  }
}
