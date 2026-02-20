import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { TokenPayload } from '@org/types/token';

export const CurrentUser = createParamDecorator(
  (data: keyof TokenPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as TokenPayload;

    if (!user) return null;

    return data ? user[data] : user;
  }
);
