import { createZodDto, ZodDto } from 'nestjs-zod';
import { UpdateProfileSchema } from '@org/schemas/auth';

export class UpdateProfileDTO extends (createZodDto(
  UpdateProfileSchema,
) as ZodDto<typeof UpdateProfileSchema, false>) {}
