import { createZodDto, ZodDto } from 'nestjs-zod';
import { EmailLoginSchema, PhoneLoginSchema } from '@org/schemas/auth';

export class EmailLoginDTO extends (createZodDto(EmailLoginSchema) as ZodDto<
  typeof EmailLoginSchema,
  false
>) {}

export class PhoneLoginDTO extends (createZodDto(PhoneLoginSchema) as ZodDto<
  typeof PhoneLoginSchema,
  false
>) {}
