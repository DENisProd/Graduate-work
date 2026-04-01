import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScenarioExecutionController } from './scenario-execution.controller';
import { ScenarioExecutionService } from './scenario-execution.service';
import {
  SCENARIO_EXECUTION_MODEL,
  ScenarioExecutionRepository,
  ScenarioExecutionSchema,
} from './scenario-execution.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SCENARIO_EXECUTION_MODEL, schema: ScenarioExecutionSchema },
    ]),
  ],
  controllers: [ScenarioExecutionController],
  providers: [ScenarioExecutionService, ScenarioExecutionRepository],
  exports: [ScenarioExecutionService],
})
export class ScenarioExecutionModule {}
