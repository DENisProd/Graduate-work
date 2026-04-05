import { createZodDto } from 'nestjs-zod';
import { createScenarioExecutionSchema } from '../schemas/scenario-execution.schema';

export class CreateScenarioExecutionDto extends createZodDto(
  createScenarioExecutionSchema,
) {}
