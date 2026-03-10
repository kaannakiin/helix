import { Module } from '@nestjs/common';
import { ExportModule } from '../../export/export.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { PriceListAssignmentsController } from './price-list-assignments.controller';
import { PriceListAssignmentsService } from './price-list-assignments.service';
import { PriceListPricesController } from './price-list-prices.controller';
import { PriceListPricesService } from './price-list-prices.service';
import { PriceListsController } from './price-lists.controller';
import { PriceListsService } from './price-lists.service';

@Module({
  imports: [PrismaModule, ExportModule],
  controllers: [
    PriceListsController,
    PriceListAssignmentsController,
    PriceListPricesController,
  ],
  providers: [
    PriceListsService,
    PriceListAssignmentsService,
    PriceListPricesService,
  ],
})
export class PriceListsModule {}
