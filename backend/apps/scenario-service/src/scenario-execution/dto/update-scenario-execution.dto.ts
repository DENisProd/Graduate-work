import { createZodDto } from 'nestjs-zod';
import { updateScenarioExecutionSchema } from '../schemas/scenario-execution.schema';

export class UpdateScenarioExecutionDto extends createZodDto(
  updateScenarioExecutionSchema,
) {}
