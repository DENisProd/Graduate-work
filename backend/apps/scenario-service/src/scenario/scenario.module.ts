import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScenarioController } from './scenario.controller';
import { ScenarioService } from './scenario.service';
import { ScenarioRepository } from './scenario.repository';
import {
  SCENARIO_MODEL,
  ScenarioSchema,
} from '../mongo/schemas/scenario.mongo';

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
