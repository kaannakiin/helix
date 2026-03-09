import { Module } from '@nestjs/common';
import { StorefrontAuthModule } from './auth/storefront-auth.module';

@Module({
  imports: [StorefrontAuthModule],
})
export class StorefrontModule {}
