import { PriceListAssignmentCreateSchema } from '@org/schemas/admin/pricing';
import { createZodDto, type ZodDto } from 'nestjs-zod';

export class PriceListAssignmentCreateDTO extends (createZodDto(
  PriceListAssignmentCreateSchema
) as ZodDto<typeof PriceListAssignmentCreateSchema, false>) {}
