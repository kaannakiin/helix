import { WarehouseQuerySchema } from '@org/schemas/admin/warehouses';
import { createZodDto, type ZodDto } from 'nestjs-zod';

export class WarehouseQueryDTO extends (createZodDto(
  WarehouseQuerySchema,
) as ZodDto<typeof WarehouseQuerySchema, false>) {}
