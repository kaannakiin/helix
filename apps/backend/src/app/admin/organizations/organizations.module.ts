import { Module } from '@nestjs/common';
import { ExportModule } from '../../export/export.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';

@Module({
  imports: [PrismaModule, ExportModule],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
})
export class OrganizationsModule {}
