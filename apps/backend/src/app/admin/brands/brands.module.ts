import { Module } from '@nestjs/common';
import { ExportModule } from '../../export/export.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { UploadModule } from '../../upload/upload.module';
import { BrandsController } from './brands.controller';
import { BrandsService } from './brands.service';

@Module({
  imports: [PrismaModule, ExportModule, UploadModule],
  controllers: [BrandsController],
  providers: [BrandsService],
})
export class BrandsModule {}
