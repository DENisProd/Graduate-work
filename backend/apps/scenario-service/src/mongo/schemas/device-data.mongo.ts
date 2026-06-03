import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import { DeviceDataType } from '../../common/schemas/enums';

export const DEVICE_DATA_MODEL = 'DeviceData';

@Schema({ collection: 'DeviceData' })
export class DeviceDataModel {
  @Prop({ required: true, type: String })
  deviceId: string;

  @Prop({ required: true, type: String })
  capability: string;

  @Prop({ type: String, default: null })
  attribute?: string | null;

  @Prop({ required: true, enum: Object.values(DeviceDataType) })
  type: DeviceDataType;

  @Prop({ required: true, type: Object })
  value: unknown;

  @Prop({ type: String, default: null })
  unit?: string | null;

  @Prop({ type: Number, default: null })
  quality?: number | null;

  @Prop({ required: true, type: Date, default: () => new Date() })
  timestamp: Date;
}

export type DeviceDataDocument = HydratedDocument<DeviceDataModel>;
export const DeviceDataSchema = SchemaFactory.createForClass(DeviceDataModel);

DeviceDataSchema.index({ deviceId: 1, capability: 1, timestamp: -1 });
DeviceDataSchema.index({ deviceId: 1, timestamp: -1 });
DeviceDataSchema.index({ capability: 1, timestamp: -1 });
