import { createZodDto, ZodDto } from 'nestjs-zod';
import { RegisterSchema } from '@org/schemas/auth';

export class RegisterDTO extends (createZodDto(RegisterSchema) as ZodDto<
  typeof RegisterSchema,
  false
>) {}
