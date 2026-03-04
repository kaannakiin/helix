import { UpdateStoreSchema } from '@org/schemas/admin/settings';
import { createZodDto, type ZodDto } from 'nestjs-zod';

export class StoreSaveDTO extends (createZodDto(
  UpdateStoreSchema
) as ZodDto<typeof UpdateStoreSchema, false>) {}
