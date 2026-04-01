import { z } from 'zod';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export function skipTake(p: PaginationQuery) {
  return {
    skip: p.page * p.limit,
    take: p.limit,
  };
}
