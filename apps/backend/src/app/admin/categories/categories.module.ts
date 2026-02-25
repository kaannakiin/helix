import { Module } from '@nestjs/common';
import { ExportModule } from '../../export/export.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

@Module({
  imports: [PrismaModule, ExportModule],
  controllers: [CategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
