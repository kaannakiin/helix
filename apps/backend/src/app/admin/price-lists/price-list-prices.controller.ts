import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  PriceListPriceBulkCreateDTO,
  PriceListPriceQueryDTO,
  PriceListPriceSaveDTO,
} from './dto/index.js';
import { PriceListPricesService } from './price-list-prices.service.js';

@ApiTags('Admin - Price List Prices')
@Controller('admin/price-lists/:priceListId/prices')
export class PriceListPricesController {
  constructor(private readonly service: PriceListPricesService) {}

  @Post('query')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Query price rows for a price list' })
  async query(
    @Param('priceListId') priceListId: string,
    @Body() query: PriceListPriceQueryDTO
  ) {
    return this.service.query(priceListId, query);
  }

  @Post('save')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create or update a price row' })
  async save(
    @Param('priceListId') priceListId: string,
    @Body() body: PriceListPriceSaveDTO
  ) {
    return this.service.save(priceListId, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a price row' })
  async delete(
    @Param('priceListId') priceListId: string,
    @Param('id') id: string
  ) {
    return this.service.delete(priceListId, id);
  }

  @Post('bulk-create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Bulk create price rows from variant selection' })
  async bulkCreate(
    @Param('priceListId') priceListId: string,
    @Body() body: PriceListPriceBulkCreateDTO
  ) {
    return this.service.bulkCreate(priceListId, body);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get price row summary statistics' })
  async summary(@Param('priceListId') priceListId: string) {
    return this.service.summary(priceListId);
  }

  @Post('search-variants')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search variants available for adding' })
  async searchVariants(
    @Param('priceListId') priceListId: string,
    @Body() body: { search: string; page: number; limit: number }
  ) {
    return this.service.searchVariants(
      priceListId,
      body.search ?? '',
      body.page ?? 1,
      body.limit ?? 20
    );
  }
}
