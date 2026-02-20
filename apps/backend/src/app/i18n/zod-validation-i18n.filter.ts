import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { Messages } from '@org/i18n';
import type { Response } from 'express';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { ZodValidationException } from 'nestjs-zod';
import type { $ZodError } from 'zod/v4/core';

@Catch(ZodValidationException)
export class ZodValidationI18nFilter implements ExceptionFilter {
  constructor(private readonly i18n: I18nService<Messages>) {}

  async catch(exception: ZodValidationException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const zodError = exception.getZodError() as $ZodError;
    const lang = I18nContext.current(host)?.lang ?? 'en';

    const errors = await Promise.all(
      zodError.issues.map(async (issue) => ({
        field: issue.path.join('.'),
        message: this.i18n.translate(issue.message as never, { lang }),
      }))
    );

    response.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      message: 'Validation failed',
      errors,
    });
  }
}
