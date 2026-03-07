import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { PlatformInstallationService } from '../../app/admin/stores/platform-installation.service.js';

@Injectable()
export class ContentLocaleInterceptor implements NestInterceptor {
  constructor(
    private readonly platformInstallationService: PlatformInstallationService
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest();
    const installation =
      await this.platformInstallationService.findCurrent();
    req.contentLocale = installation?.defaultLocale ?? 'TR';
    return next.handle();
  }
}
