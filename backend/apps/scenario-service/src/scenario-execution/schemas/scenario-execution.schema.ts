import { z } from 'zod';
import {
  triggerSourceTypeSchema,
  scenarioExecutionStatusSchema,
} from '../../common/schemas/enums';
import { ScenarioExecutionStatus } from '../../common/schemas/enums';
import { paginationQuerySchema } from '../../common/schemas/pagination';

export const createScenarioExecutionSchema = z.object({
  scenarioId: z.string().min(1),
  status: scenarioExecutionStatusSchema.default(
    ScenarioExecutionStatus.RUNNING,
  ),
  triggeredBy: triggerSourceTypeSchema,
  triggerData: z.record(z.unknown()),
  errorMessage: z.string().max(2000).optional(),
});
export type CreateScenarioExecutionInput = z.infer<
  typeof createScenarioExecutionSchema
>;

export const updateScenarioExecutionSchema = z.object({
  status: scenarioExecutionStatusSchema.optional(),
  errorMessage: z.string().max(2000).optional().nullable(),
  endedAt: z.coerce.date().optional().nullable(),
});
export type UpdateScenarioExecutionInput = z.infer<
  typeof updateScenarioExecutionSchema
>;

const listScenarioExecutionsQuerySchemaBase = z.object({
  scenarioId: z.string().min(1).optional(),
  status: scenarioExecutionStatusSchema.optional(),
  triggeredBy: triggerSourceTypeSchema.optional(),
});
export const listScenarioExecutionsQuerySchema =
  listScenarioExecutionsQuerySchemaBase.merge(paginationQuerySchema);
export type ListScenarioExecutionsQuery = z.infer<
  typeof listScenarioExecutionsQuerySchema
>;
