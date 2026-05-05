import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { UserService } from './users.service';

function headerString(
  raw: string | string[] | undefined,
): string | undefined {
  if (raw == null) return undefined;
  const v = Array.isArray(raw) ? raw[0] : raw;
  const s = v != null ? String(v).trim() : '';
  return s.length > 0 ? s : undefined;
}

@Injectable()
export class SyncUserDisplayNameInterceptor implements NestInterceptor {
  constructor(private readonly userService: UserService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
    }>();
    const externalUserId = headerString(req.headers['x-user-id']);
    const rawDisplay = headerString(req.headers['x-user-display-name']);
    if (!externalUserId || !rawDisplay) {
      return next.handle();
    }
    let displayName = rawDisplay;
    try {
      displayName = decodeURIComponent(rawDisplay);
    } catch {
      /* use raw */
    }
    void this.userService.upsertDisplayName(externalUserId, displayName).catch(() => {});
    return next.handle();
  }
}
