import { PlatformInstallationSchema } from '@org/schemas/admin/settings';
import { createZodDto, type ZodDto } from 'nestjs-zod';

export class PlatformInstallationDTO extends (createZodDto(
  PlatformInstallationSchema
) as ZodDto<typeof PlatformInstallationSchema, false>) {}
