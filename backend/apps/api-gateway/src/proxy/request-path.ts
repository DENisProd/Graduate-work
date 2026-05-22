import type { Request } from 'express';

/** Pathname for routing — use originalUrl, not req.path (Nest middleware strips path). */
export function getRequestPathname(req: Request): string {
  const raw = req.originalUrl ?? req.url ?? '';
  const q = raw.indexOf('?');
  return (q === -1 ? raw : raw.slice(0, q)) || '/';
}
