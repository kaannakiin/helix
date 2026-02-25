import { createZodDto, ZodDto } from 'nestjs-zod';
import { evaluatePreviewSchema } from '@org/schemas/rule-engine';

export class EvaluatePreviewDTO extends (createZodDto(
  evaluatePreviewSchema,
) as ZodDto<typeof evaluatePreviewSchema, false>) {}
