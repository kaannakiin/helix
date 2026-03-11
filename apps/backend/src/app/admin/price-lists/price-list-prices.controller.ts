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
import { AuthzCtx } from '../../../core/decorators/authz-context.decorator';
import { RequireCapability } from '../../../core/decorators/require-capability.decorator';
import { CAPABILITIES, type AuthorizationContext } from '@org/types/authorization';
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
  @RequireCapability(CAPABILITIES.PRICE_LISTS_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Query price rows for a price list' })
  async query(
    @Param('priceListId') priceListId: string,
    @Body() query: PriceListPriceQueryDTO,
    @AuthzCtx() authzCtx: AuthorizationContext
  ) {
    return this.service.query(priceListId, query, authzCtx);
  }

  @Post('save')
  @RequireCapability(CAPABILITIES.PRICE_LISTS_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create or update a price row' })
  async save(
    @Param('priceListId') priceListId: string,
    @Body() body: PriceListPriceSaveDTO,
    @AuthzCtx() authzCtx: AuthorizationContext
  ) {
    return this.service.save(priceListId, body, authzCtx);
  }

  @Delete(':id')
  @RequireCapability(CAPABILITIES.PRICE_LISTS_WRITE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a price row' })
  async delete(
    @Param('priceListId') priceListId: string,
    @Param('id') id: string,
    @AuthzCtx() authzCtx: AuthorizationContext
  ) {
    return this.service.delete(priceListId, id, authzCtx);
  }

  @Post('bulk-create')
  @RequireCapability(CAPABILITIES.PRICE_LISTS_WRITE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Bulk create price rows from variant selection' })
  async bulkCreate(
    @Param('priceListId') priceListId: string,
    @Body() body: PriceListPriceBulkCreateDTO,
    @AuthzCtx() authzCtx: AuthorizationContext
  ) {
    return this.service.bulkCreate(priceListId, body, authzCtx);
  }

  @Get('summary')
  @RequireCapability(CAPABILITIES.PRICE_LISTS_READ)
  @ApiOperation({ summary: 'Get price row summary statistics' })
  async summary(
    @Param('priceListId') priceListId: string,
    @AuthzCtx() authzCtx: AuthorizationContext
  ) {
    return this.service.summary(priceListId, authzCtx);
  }

  @Post('search-variants')
  @RequireCapability(CAPABILITIES.PRICE_LISTS_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search variants available for adding' })
  async searchVariants(
    @Param('priceListId') priceListId: string,
    @Body() body: { search: string; page: number; limit: number },
    @AuthzCtx() authzCtx: AuthorizationContext
  ) {
    return this.service.searchVariants(
      priceListId,
      body.search ?? '',
      body.page ?? 1,
      body.limit ?? 20,
      authzCtx
    );
  }
}
