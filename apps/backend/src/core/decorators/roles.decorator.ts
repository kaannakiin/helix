import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '@org/constants/auth-constants';
import type { UserRole } from '@org/prisma/client';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
