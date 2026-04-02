import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';

export enum Protocol {
  Zigbee = 'Zigbee',
  ZWave = 'ZWave',
  Matter = 'Matter',
  WiFi = 'WiFi',
  Bluetooth = 'Bluetooth',
  Unknown = 'Unknown',
}

export const DEVICE_NETWORK_LINK_MODEL = 'DeviceNetworkLink';

@Schema({ collection: 'DeviceNetworkLink' })
export class DeviceNetworkLinkModel {
  @Prop({ required: true, type: Types.ObjectId })
  sourceDeviceId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId })
  targetDeviceId: Types.ObjectId;

  @Prop({ required: true, enum: Object.values(Protocol) })
  protocol: Protocol;

  @Prop({ type: Number, default: null })
  linkQuality?: number | null;

  @Prop({ type: Number, default: null })
  rssi?: number | null;

  @Prop({ type: Number, default: null })
  lqi?: number | null;

  @Prop({ type: Object, default: null })
  metadata?: Record<string, unknown> | null;

  @Prop({ required: true, type: Date, default: () => new Date() })
  collectedAt: Date;
}

export type DeviceNetworkLinkDocument =
  HydratedDocument<DeviceNetworkLinkModel>;
export const DeviceNetworkLinkSchema = SchemaFactory.createForClass(
  DeviceNetworkLinkModel,
);

DeviceNetworkLinkSchema.index(
  { sourceDeviceId: 1, targetDeviceId: 1, protocol: 1 },
  { unique: true },
);
DeviceNetworkLinkSchema.index({ sourceDeviceId: 1, collectedAt: -1 });

