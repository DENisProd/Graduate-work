import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SCENARIO_MODEL,
  ScenarioSchema,
} from '../mongo/schemas/scenario.mongo';
import { ZigbeeModule } from '../zigbee/zigbee.module';
import { ScenarioExecutionModule } from '../scenario-execution/scenario-execution.module';
import { ScenarioEngineService } from './scenario-engine.service';
import { ScenarioEngineController } from './scenario-engine.controller';
import { ConditionEvaluatorService } from './condition-evaluator.service';
import { ActionExecutorService } from './action-executor.service';
import { ConcurrencyGuardService } from './concurrency-guard.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SCENARIO_MODEL, schema: ScenarioSchema },
    ]),
    ZigbeeModule,
    ScenarioExecutionModule,
  ],
  controllers: [ScenarioEngineController],
  providers: [
    ScenarioEngineService,
    ConditionEvaluatorService,
    ActionExecutorService,
    ConcurrencyGuardService,
  ],
  exports: [ScenarioEngineService],
})
export class ScenarioEngineModule {}
