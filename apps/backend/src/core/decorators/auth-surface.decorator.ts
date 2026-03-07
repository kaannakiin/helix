import { SetMetadata } from '@nestjs/common';
import {
  AUTH_SURFACE_KEY,
  STOREFRONT_AUTH_SURFACE,
} from '@org/constants/auth-constants';

export type AuthSurfaceName = typeof STOREFRONT_AUTH_SURFACE;

export const AuthSurface = (surface: AuthSurfaceName) =>
  SetMetadata(AUTH_SURFACE_KEY, surface);
