import { PriceListAssignmentUpdateSchema } from '@org/schemas/admin/pricing';
import { createZodDto, type ZodDto } from 'nestjs-zod';

export class PriceListAssignmentUpdateDTO extends (createZodDto(
  PriceListAssignmentUpdateSchema
) as ZodDto<typeof PriceListAssignmentUpdateSchema, false>) {}
