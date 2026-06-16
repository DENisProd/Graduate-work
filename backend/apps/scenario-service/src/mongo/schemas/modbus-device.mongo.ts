import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export const MODBUS_DEVICE_MODEL = 'ModbusDevice';

@Schema({
  collection: 'ModbusDevice',
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
})
export class ModbusDeviceModel {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  slaveId: number;

  @Prop({ type: String, default: null })
  description?: string | null;

  @Prop({ default: true })
  enabled: boolean;

  @Prop({ type: String, default: null, index: true })
  houseId?: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export type ModbusDeviceDocument = HydratedDocument<ModbusDeviceModel>;
export const ModbusDeviceSchema = SchemaFactory.createForClass(ModbusDeviceModel);
