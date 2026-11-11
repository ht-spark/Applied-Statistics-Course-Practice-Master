import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    if (!request.userId) {
      throw new Error('CurrentUser decorator used without JwtAuthGuard');
    }
    return request.userId;
  },
);
