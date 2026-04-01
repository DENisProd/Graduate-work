import { z } from 'zod';
import { scenarioStatusSchema } from '../../common/schemas/enums';

export const createScenarioSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  status: scenarioStatusSchema.default('OFFLINE'),
  creatorId: z.string().min(1).max(255),
  houseId: z.string().min(1).max(255),
});
export type CreateScenarioInput = z.infer<typeof createScenarioSchema>;

export const updateScenarioSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional().nullable(),
  status: scenarioStatusSchema.optional(),
});
export type UpdateScenarioInput = z.infer<typeof updateScenarioSchema>;

export const listScenariosQuerySchema = z.object({
  houseId: z.string().min(1).max(255).optional(),
  status: scenarioStatusSchema.optional(),
  creatorId: z.string().optional(),
  page: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListScenariosQuery = z.infer<typeof listScenariosQuerySchema>;
