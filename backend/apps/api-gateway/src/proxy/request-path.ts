import type { Request } from 'express';

export function getRequestPathname(req: Request): string {
  const raw = req.originalUrl ?? req.url ?? '';
  const q = raw.indexOf('?');
  return (q === -1 ? raw : raw.slice(0, q)) || '/';
}
