import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import { ZigbeeDeviceType } from '../../zigbee/schemas/zigbee.schemas';

export const PHYSICAL_DEVICE_MODEL = 'PhysicalDevice';

@Schema({ collection: 'PhysicalDevice' })
export class PhysicalDeviceModel {

  // Базовая информация
  @Prop({ type: String, default: null })
  name?: string | null;
  @Prop({ type: String, default: null })
  description?: string | null;


  @Prop({ type: String, default: null })
  houseId?: string | null;

  @Prop({ type: String, default: null })
  roomId?: string | null;

  @Prop({ type: String, default: null })
  deviceId?: string | null;

  // Zigbee identity (flattened — no nested object)
  @Prop({ type: String, default: null })
  protocolAddress?: string | null; // ieeeAddr (Zigbee)

  @Prop({ type: Number, default: null })
  networkAddress?: number | null;

  @Prop({
    enum: Object.values(ZigbeeDeviceType),
    default: ZigbeeDeviceType.EndDevice,
    type: String,
  })
  type?: ZigbeeDeviceType;

  // Тип и производитель
  @Prop({ type: Number, default: null })
  deviceTypeId?: number | null;
  @Prop({ type: String, default: null })
  manufacturerName?: string | null;
  @Prop({ type: String, default: null })
  model?: string | null;
  @Prop({ type: String, default: null })
  friendlyName?: string | null;
  @Prop({ type: String, default: null })
  firmwareVersion?: string | null;

  @Prop({ type: Date, default: null })
  lastSeen?: Date | null;

  @Prop({ type: Object, default: null })
  definition?: Record<string, unknown> | null;

  @Prop({ type: [String], default: [] })
  capabilities?: string[];


  @Prop({ required: true })
  createdAt: Date;
  @Prop({ required: true })
  updatedAt: Date;
}

export type PhysicalDeviceDocument = HydratedDocument<PhysicalDeviceModel>;
export const PhysicalDeviceSchema =
  SchemaFactory.createForClass(PhysicalDeviceModel);

PhysicalDeviceSchema.index(
  { protocolAddress: 1 },
  { unique: true, sparse: true },
);

