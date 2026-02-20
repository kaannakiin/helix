import { createZodDto, ZodDto } from 'nestjs-zod';
import { ChangePasswordSchema } from '@org/schemas/auth';

export class ChangePasswordDTO extends (createZodDto(
  ChangePasswordSchema,
) as ZodDto<typeof ChangePasswordSchema, false>) {}
