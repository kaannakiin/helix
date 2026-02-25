import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RuleEngineController } from './rule-engine.controller';
import { RuleEngineService } from './rule-engine.service';

@Module({
  imports: [PrismaModule],
  controllers: [RuleEngineController],
  providers: [RuleEngineService],
  exports: [RuleEngineService],
})
export class RuleEngineModule {}
