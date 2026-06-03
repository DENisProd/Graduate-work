import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type RegisterType = 'holding' | 'input' | 'coil' | 'discrete';

// ─── Register ────────────────────────────────────────────────────────────────

export const MODBUS_REGISTER_MODEL = 'ModbusRegister';

@Schema({
  collection: 'ModbusRegister',
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
})
export class ModbusRegisterModel {
  @Prop({ required: true, type: String })
  deviceId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['holding', 'input', 'coil', 'discrete'] })
  registerType: RegisterType;

  @Prop({ required: true })
  address: number;

  @Prop({ default: 1 })
  count: number;

  @Prop({ type: String, default: null })
  unit?: string | null;

  @Prop({ default: 1.0 })
  scaleFactor: number;

  @Prop({ default: 0.0 })
  offset: number;

  @Prop({ default: false })
  writable: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export type ModbusRegisterDocument = HydratedDocument<ModbusRegisterModel>;
export const ModbusRegisterSchema = SchemaFactory.createForClass(ModbusRegisterModel);
ModbusRegisterSchema.index({ deviceId: 1 });

// ─── State ───────────────────────────────────────────────────────────────────

export const MODBUS_REGISTER_STATE_MODEL = 'ModbusRegisterState';

@Schema({ collection: 'ModbusRegisterState' })
export class ModbusRegisterStateModel {
  @Prop({ required: true, type: String })
  registerId: string;

  @Prop({ type: [Number], default: [] })
  rawValues: number[];

  @Prop({ type: [Number], default: [] })
  scaledValues: number[];

  @Prop({ required: true })
  timestamp: Date;
}

export type ModbusRegisterStateDocument = HydratedDocument<ModbusRegisterStateModel>;
export const ModbusRegisterStateSchema = SchemaFactory.createForClass(ModbusRegisterStateModel);
ModbusRegisterStateSchema.index({ registerId: 1 }, { unique: true });
