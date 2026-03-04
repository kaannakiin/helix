import { CreateStoreSchema } from '@org/schemas/admin/settings';
import { createZodDto, type ZodDto } from 'nestjs-zod';

export class StoreCreateDTO extends (createZodDto(
  CreateStoreSchema
) as ZodDto<typeof CreateStoreSchema, false>) {}
