import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { STORE_ID_HEADER } from '@org/constants/auth-constants';
import type { StoreContext } from '@org/types/store';
import type { Observable } from 'rxjs';
import { StoresService } from './stores.service.js';

@Injectable()
export class StoreContextInterceptor implements NestInterceptor {
  constructor(private readonly storeService: StoresService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<unknown>> {
    const request = context
      .switchToHttp()
      .getRequest<Record<string, unknown>>();
    const headers = request['headers'] as Record<string, string>;
    const storeId = headers[STORE_ID_HEADER];

    if (storeId) {
      try {
        const store = await this.storeService.findById(storeId);
        request['storeContext'] = {
          storeId: store.id,
          businessModel: store.businessModel,
          slug: store.slug,
        } satisfies StoreContext;
      } catch {}
    }

    return next.handle();
  }
}
