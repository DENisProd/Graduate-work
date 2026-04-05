import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import { ScenarioStatus } from '../../common/schemas/enums';

export const SCENARIO_MODEL = 'Scenario';

@Schema({ collection: 'Scenario' })
export class ScenarioModel {
  @Prop({ required: true })
  name: string;
  @Prop({ type: String, default: null })
  description?: string | null;
  @Prop({ required: true, type: String })
  houseId: string;

  @Prop({ required: true, type: Object })
  definition: Record<string, unknown>;

  @Prop({ required: true, enum: Object.values(ScenarioStatus) })
  status: ScenarioStatus;
  @Prop({ required: true })
  creatorId: string;

  @Prop({ required: true })
  createdAt: Date;
  @Prop({ required: true })
  updatedAt: Date;
}

export type ScenarioDocument = HydratedDocument<ScenarioModel>;
export const ScenarioSchema = SchemaFactory.createForClass(ScenarioModel);
