import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export const UserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest<{ headers: Record<string, string | string[] | undefined> }>();
    const raw = req.headers['x-user-id'];
    const value = Array.isArray(raw) ? raw[0] : raw;
    const userId = value ? String(value).trim() : '';
    if (!userId) {
      throw new UnauthorizedException('Требуется заголовок X-User-Id с идентификатором пользователя');
    }
    return userId;
  },
);
