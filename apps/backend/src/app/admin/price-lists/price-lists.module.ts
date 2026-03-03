import { Module } from '@nestjs/common';
import { ExportModule } from '../../export/export.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { PriceListsController } from './price-lists.controller';
import { PriceListsService } from './price-lists.service';

@Module({
  imports: [PrismaModule, ExportModule],
  controllers: [PriceListsController],
  providers: [PriceListsService],
})
export class PriceListsModule {}
