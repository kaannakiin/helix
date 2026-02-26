import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Locale as LocaleType } from '@org/prisma/client';
import { I18nContext } from 'nestjs-i18n';

export const LocaleDecorator = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): LocaleType => {
    return (I18nContext.current(ctx)?.lang.toUpperCase() as LocaleType) ?? 'TR';
  }
);
