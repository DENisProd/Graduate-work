import { createZodDto } from 'nestjs-zod';
import { createScenarioSchema } from '../schemas/scenario.schema';

export class CreateScenarioDto extends createZodDto(createScenarioSchema) {}
