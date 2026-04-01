import { z } from 'zod';
import {
  triggerSourceTypeSchema,
  scenarioExecutionStatusSchema,
} from '../../common/schemas/enums';

export const createScenarioExecutionSchema = z.object({
  scenarioId: z.string().min(1),
  status: scenarioExecutionStatusSchema.default('RUNNING'),
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

export const listScenarioExecutionsQuerySchema = z.object({
  scenarioId: z.string().min(1).optional(),
  status: scenarioExecutionStatusSchema.optional(),
  triggeredBy: triggerSourceTypeSchema.optional(),
  page: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListScenarioExecutionsQuery = z.infer<
  typeof listScenarioExecutionsQuerySchema
>;
