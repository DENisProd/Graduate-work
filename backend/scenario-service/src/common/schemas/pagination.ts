import { z } from 'zod';

const coerceOptionalInt = (opts: {
  min: number;
  max?: number;
  defaultValue: number;
}) =>
  z
    .preprocess(
      (v) => (v === '' || v === null || v === undefined ? undefined : v),
      z.coerce
        .number()
        .int()
        .min(opts.min)
        .max(opts.max ?? Number.POSITIVE_INFINITY)
        .optional(),
    )
    .default(opts.defaultValue);

export const paginationQuerySchema = z.object({
  page: coerceOptionalInt({ min: 1, defaultValue: 1 }),
  limit: coerceOptionalInt({ min: 1, max: 100, defaultValue: 20 }),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export function skipTake(p: PaginationQuery) {
  // Be defensive: some internal callers may bypass Zod parsing.
  const page = Number.isFinite(p.page) ? Math.max(1, Math.trunc(p.page)) : 1;
  const limit = Number.isFinite(p.limit)
    ? Math.min(100, Math.max(1, Math.trunc(p.limit)))
    : 20;

  return {
    skip: Math.max(0, (page - 1) * limit),
    take: limit,
  };
}
