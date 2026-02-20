import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';

export const Locale = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    return I18nContext.current(ctx)?.lang ?? 'en';
  },
);
