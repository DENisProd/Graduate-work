import { z } from 'zod';
import { scenarioStatusSchema } from '../../common/schemas/enums';
import { ScenarioStatus } from '../../common/schemas/enums';
import { scenarioDefinitionSchema } from './scenario-definition.schema';
import { paginationQuerySchema } from '../../common/schemas/pagination';

export const createScenarioSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  status: scenarioStatusSchema.default(ScenarioStatus.OFFLINE),
  creatorId: z.string().min(1).max(255),
  houseId: z.string().min(1).max(255),
  /**
   * Полноценное определение сценария (триггеры/условия/действия/контекст).
   * Хранится в Mongo в поле `definition`.
   */
  definition: scenarioDefinitionSchema,
});
export type CreateScenarioInput = z.infer<typeof createScenarioSchema>;

export const updateScenarioSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional().nullable(),
  status: scenarioStatusSchema.optional(),
  definition: scenarioDefinitionSchema.optional(),
});
export type UpdateScenarioInput = z.infer<typeof updateScenarioSchema>;

const listScenariosQuerySchemaBase = z.object({
  houseId: z.string().min(1).max(255).optional(),
  status: scenarioStatusSchema.optional(),
  creatorId: z.string().optional(),
});
export const listScenariosQuerySchema = listScenariosQuerySchemaBase.merge(
  paginationQuerySchema,
);
export type ListScenariosQuery = z.infer<typeof listScenariosQuerySchema>;
