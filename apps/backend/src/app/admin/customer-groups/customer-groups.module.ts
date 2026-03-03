import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { EvaluationModule } from '../../evaluation/evaluation.module';
import { CustomerGroupsController } from './customer-groups.controller';
import { CustomerGroupsService } from './customer-groups.service';

@Module({
  imports: [PrismaModule, EvaluationModule],
  controllers: [CustomerGroupsController],
  providers: [CustomerGroupsService],
})
export class CustomerGroupsModule {}
