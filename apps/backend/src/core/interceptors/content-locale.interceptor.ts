import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { StoreContext } from '@org/types/store';
import { StoresService } from '../../app/admin/stores/stores.service.js';

@Injectable()
export class ContentLocaleInterceptor implements NestInterceptor {
  constructor(private readonly storeSettings: StoresService) {}

  async intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest();
    const storeContext = req['storeContext'] as StoreContext | undefined;

    if (storeContext) {
      const store = await this.storeSettings.findById(storeContext.storeId);
      req.contentLocale = store.defaultLocale;
    } else {
      const stores = await this.storeSettings.list();
      req.contentLocale = stores[0]?.defaultLocale ?? 'TR';
    }

    return next.handle();
  }
}
