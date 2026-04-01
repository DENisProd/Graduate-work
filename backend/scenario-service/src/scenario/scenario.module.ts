import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScenarioController } from './scenario.controller';
import { ScenarioService } from './scenario.service';
import {
  SCENARIO_MODEL,
  ScenarioRepository,
  ScenarioSchema,
} from './scenario.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SCENARIO_MODEL, schema: ScenarioSchema },
    ]),
  ],
  controllers: [ScenarioController],
  providers: [ScenarioService, ScenarioRepository],
  exports: [ScenarioService],
})
export class ScenarioModule {}
