import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export const HOUSE_FLOOR_PLAN_MODEL = 'HouseFloorPlan';

@Schema({ collection: 'house_floor_plans', timestamps: true })
export class HouseFloorPlanModel {
  @Prop({ required: true, unique: true, index: true })
  houseId!: string;

  @Prop({ required: true, default: 1 })
  version!: number;

  @Prop({ type: Object, required: true })
  snapshot!: Record<string, unknown>;

  @Prop()
  updatedBy?: string;
}

export type HouseFloorPlanDocument = HydratedDocument<HouseFloorPlanModel>;
export const HouseFloorPlanSchema =
  SchemaFactory.createForClass(HouseFloorPlanModel);
