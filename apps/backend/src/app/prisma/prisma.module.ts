import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DocumentNumberService } from './document-number.service';
import { ExternalReferenceService } from './external-reference.service';
import { PrismaService } from './prisma.service';
import { StockMovementStatusHistoryService } from './stock-movement-status-history.service';

@Module({
  imports: [ConfigModule],
  providers: [
    PrismaService,
    DocumentNumberService,
    ExternalReferenceService,
    StockMovementStatusHistoryService,
  ],
  exports: [
    PrismaService,
    DocumentNumberService,
    ExternalReferenceService,
    StockMovementStatusHistoryService,
  ],
})
export class PrismaModule {}
