import { z } from 'zod';

export const dashboardOverviewQuerySchema = z.object({
  houseId: z
    .union([z.string().min(1).max(255), z.array(z.string().min(1).max(255))])
    .transform((v) => (Array.isArray(v) ? v : [v])),
  /** ISO string or any Date-parsable value */
  from: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(5),
});

export type DashboardOverviewQuery = z.infer<typeof dashboardOverviewQuerySchema>;

