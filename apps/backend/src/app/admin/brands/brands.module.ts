import { Module } from '@nestjs/common';
import { ExportModule } from '../../export/export.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { BrandsController } from './brands.controller';
import { BrandsService } from './brands.service';

@Module({
  imports: [PrismaModule, ExportModule],
  controllers: [BrandsController],
  providers: [BrandsService],
})
export class BrandsModule {}
