import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import type { Messages } from '@org/i18n';
import type { Response } from 'express';
import { I18nContext, I18nService } from 'nestjs-i18n';

@Catch(HttpException)
export class HttpExceptionI18nFilter implements ExceptionFilter {
  constructor(private readonly i18n: I18nService<Messages>) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    const lang = I18nContext.current(host)?.lang ?? 'en';

    let message: string;

    if (typeof exceptionResponse === 'string') {
      message = this.tryTranslate(exceptionResponse, lang);
    } else if (
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse
    ) {
      const msg = (exceptionResponse as Record<string, unknown>).message;
      message =
        typeof msg === 'string' ? this.tryTranslate(msg, lang) : String(msg);
    } else {
      message = exception.message;
    }

    response.status(status).json({
      statusCode: status,
      message,
    });
  }

  private tryTranslate(key: string, lang: string): string {
    return this.i18n.translate(key as never, { lang });
  }
}
