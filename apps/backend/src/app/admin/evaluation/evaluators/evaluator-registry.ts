import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { BaseEvaluator } from './base-evaluator';
import { CustomerGroupEvaluator } from './customer-group.evaluator';

@Injectable()
export class EvaluatorRegistry implements OnModuleInit {
  private readonly logger = new Logger(EvaluatorRegistry.name);
  private readonly evaluators = new Map<string, BaseEvaluator>();

  constructor(private readonly moduleRef: ModuleRef) {}

  onModuleInit() {
    const impls = [this.moduleRef.get(CustomerGroupEvaluator)];

    for (const evaluator of impls) {
      this.evaluators.set(evaluator.targetEntity, evaluator);
      this.logger.log(`Registered evaluator: ${evaluator.targetEntity}`);
    }
  }

  getEvaluator(targetEntity: string): BaseEvaluator {
    const evaluator = this.evaluators.get(targetEntity);
    if (!evaluator) {
      throw new Error(
        `No evaluator registered for target entity: ${targetEntity}`
      );
    }
    return evaluator;
  }

  hasEvaluator(targetEntity: string): boolean {
    return this.evaluators.has(targetEntity);
  }
}
