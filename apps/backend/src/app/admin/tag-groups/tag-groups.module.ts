import { Module } from '@nestjs/common';
import { ExportModule } from '../../export/export.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { TagGroupsController } from './tag-groups.controller';
import { TagGroupsService } from './tag-groups.service';

@Module({
  imports: [PrismaModule, ExportModule],
  controllers: [TagGroupsController],
  providers: [TagGroupsService],
})
export class TagGroupsModule {}
