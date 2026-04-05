import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export const ZIGBEE_STATE_MODEL = 'ZigbeeDeviceState';

@Schema({ collection: 'ZigbeeDeviceState' })
export class ZigbeeDeviceStateModel {
  @Prop({ required: true })
  deviceIeeeAddr: string;

  @Prop({ required: true, type: Date })
  timestamp: Date;

  @Prop({ required: true, type: Object })
  payload: Record<string, unknown>;

  @Prop({ type: String, default: null })
  state?: string | null;

  @Prop({ type: Number, default: null })
  brightness?: number | null;

  @Prop({ type: Number, default: null })
  linkquality?: number | null;

  @Prop({ type: String, default: null })
  colorMode?: string | null;

  @Prop({ type: Boolean, default: null })
  occupancy?: boolean | null;

  @Prop({ type: Number, default: null })
  temperature?: number | null;

  @Prop({ type: Number, default: null })
  humidity?: number | null;

  @Prop({ type: Number, default: null })
  battery?: number | null;
}

export type ZigbeeDeviceStateDocument =
  HydratedDocument<ZigbeeDeviceStateModel>;
export const ZigbeeStateSchema = SchemaFactory.createForClass(
  ZigbeeDeviceStateModel,
);
ZigbeeStateSchema.index({ deviceIeeeAddr: 1, timestamp: -1 });
