import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import {
  ScenarioExecutionStatus,
  TriggerSourceType,
} from '../../common/schemas/enums';

export const SCENARIO_EXECUTION_MODEL = 'ScenarioExecution';

@Schema({ collection: 'ScenarioExecution' })
export class ScenarioExecutionModel {
  @Prop({ required: true })
  scenarioId: string;

  @Prop({ required: true, enum: Object.values(ScenarioExecutionStatus) })
  status: ScenarioExecutionStatus;

  @Prop({
    required: true,
    enum: Object.values(TriggerSourceType),
  })
  triggeredBy: TriggerSourceType;

  @Prop({ required: true, type: Object })
  triggerData: Record<string, unknown>;

  @Prop({ type: String, default: null })
  errorMessage?: string | null;

  @Prop({ required: true })
  startedAt: Date;

  @Prop({ type: Date, default: null })
  endedAt?: Date | null;
}

export type ScenarioExecutionDocument =
  HydratedDocument<ScenarioExecutionModel>;
export const ScenarioExecutionSchema = SchemaFactory.createForClass(
  ScenarioExecutionModel,
);
