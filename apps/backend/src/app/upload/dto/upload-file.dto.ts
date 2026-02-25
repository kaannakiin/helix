import { UploadFileSchema } from '@org/schemas/admin/upload';
import { createZodDto, type ZodDto } from 'nestjs-zod';

export class UploadFileDTO extends (createZodDto(
  UploadFileSchema,
) as ZodDto<typeof UploadFileSchema, false>) {}
