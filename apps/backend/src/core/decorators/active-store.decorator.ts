import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { StoreContext } from '@org/types/store';

export const ActiveStore = createParamDecorator(
  (field: keyof StoreContext | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const store = request['storeContext'] as StoreContext | undefined;

    if (!store) return null;

    return field ? store[field] : store;
  }
);
