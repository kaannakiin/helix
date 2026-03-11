import { SetMetadata } from '@nestjs/common';
import { CAPABILITY_KEY } from '@org/constants/auth-constants';

export const RequireCapability = (capability: string) =>
  SetMetadata(CAPABILITY_KEY, capability);
