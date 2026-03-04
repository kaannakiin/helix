import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Locale } from '@org/prisma/client';

export const ContentLocale = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Locale => {
    return ctx.switchToHttp().getRequest().contentLocale ?? 'TR';
  }
);
