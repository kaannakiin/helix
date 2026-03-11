import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthorizationContext } from '@org/types/authorization';

export const AuthzCtx = createParamDecorator(
  (
    data: keyof AuthorizationContext | undefined,
    ctx: ExecutionContext,
  ) => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ authzContext?: AuthorizationContext }>();
    const authzContext = request.authzContext;
    return data ? authzContext?.[data] : authzContext;
  },
);
