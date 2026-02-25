import { Module } from '@nestjs/common';
import { ExportModule } from '../../export/export.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { UploadModule } from '../../upload/upload.module';
import { VariantGroupsController } from './variant-groups.controller';
import { VariantGroupsService } from './variant-groups.service';

@Module({
  imports: [PrismaModule, ExportModule, UploadModule],
  controllers: [VariantGroupsController],
  providers: [VariantGroupsService],
})
export class VariantGroupsModule {}
