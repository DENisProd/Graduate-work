import { createZodDto } from 'nestjs-zod';
import { updateScenarioSchema } from '../schemas/scenario.schema';

export class UpdateScenarioDto extends createZodDto(updateScenarioSchema) {}
