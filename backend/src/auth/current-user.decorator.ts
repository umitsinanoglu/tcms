import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface RequestUser {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): RequestUser | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.user || null;
  },
);
