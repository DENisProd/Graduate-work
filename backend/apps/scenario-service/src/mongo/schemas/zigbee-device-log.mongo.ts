import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export const ZIGBEE_DEVICE_LOG_MODEL = 'ZigbeeDeviceLog';

export enum ZigbeeDeviceLogSource {
  Mqtt = 'mqtt',
  Api = 'api',
}

export enum ZigbeeDeviceLogKind {
  StateIngest = 'state_ingest',
  BridgeEvent = 'bridge_event',
}

@Schema({ collection: 'ZigbeeDeviceLog' })
export class ZigbeeDeviceLogModel {
  @Prop({ required: true })
  deviceIeeeAddr: string;

  @Prop({ type: String, default: null })
  physicalDeviceId?: string | null;

  @Prop({ required: true, type: Date })
  timestamp: Date;

  @Prop({
    required: true,
    enum: Object.values(ZigbeeDeviceLogSource),
    type: String,
  })
  source: ZigbeeDeviceLogSource;

  @Prop({
    required: true,
    enum: Object.values(ZigbeeDeviceLogKind),
    type: String,
  })
  kind: ZigbeeDeviceLogKind;

  @Prop({ type: String, default: null })
  message?: string | null;

  @Prop({ type: Object, default: null })
  metrics?: {
    state?: string | null;
    brightness?: number | null;
    linkquality?: number | null;
    colorMode?: string | null;
    occupancy?: boolean | null;
    temperature?: number | null;
    humidity?: number | null;
    battery?: number | null;
  } | null;

  @Prop({ type: [String], default: [] })
  payloadKeys?: string[];

  @Prop({ type: String, default: null })
  stateDocumentId?: string | null;

  @Prop({ type: Object, default: null })
  metadata?: Record<string, unknown> | null;
}

export type ZigbeeDeviceLogDocument = HydratedDocument<ZigbeeDeviceLogModel>;

export const ZigbeeDeviceLogSchema =
  SchemaFactory.createForClass(ZigbeeDeviceLogModel);

ZigbeeDeviceLogSchema.index({ deviceIeeeAddr: 1, timestamp: -1 });
ZigbeeDeviceLogSchema.index({ physicalDeviceId: 1, timestamp: -1 });
