import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import {
  MODBUS_DEVICE_MODEL,
  ModbusDeviceDocument,
  ModbusDeviceModel,
} from '../mongo/schemas/modbus-device.mongo';
import {
  MODBUS_REGISTER_MODEL,
  MODBUS_REGISTER_STATE_MODEL,
  ModbusRegisterDocument,
  ModbusRegisterModel,
  ModbusRegisterStateDocument,
  ModbusRegisterStateModel,
} from '../mongo/schemas/modbus-register.mongo';
import type { CreateModbusDeviceDto, CreateModbusRegisterDto } from './dto/modbus.dto';

@Injectable()
export class ModbusDeviceRepository {
  constructor(
    @InjectModel(MODBUS_DEVICE_MODEL)
    private readonly deviceModel: Model<ModbusDeviceDocument>,
    @InjectModel(MODBUS_REGISTER_MODEL)
    private readonly registerModel: Model<ModbusRegisterDocument>,
    @InjectModel(MODBUS_REGISTER_STATE_MODEL)
    private readonly stateModel: Model<ModbusRegisterStateDocument>,
  ) {}

  // ─── Devices ──────────────────────────────────────────────────────────────

  async listDevices(): Promise<ModbusDeviceDocument[]> {
    return this.deviceModel.find().sort({ createdAt: 1 }).exec();
  }

  async findDevice(id: string): Promise<ModbusDeviceDocument | null> {
    return this.deviceModel.findById(id).exec();
  }

  async createDevice(dto: CreateModbusDeviceDto): Promise<ModbusDeviceDocument> {
    return this.deviceModel.create({
      name: dto.name,
      slaveId: dto.slaveId,
      description: dto.description ?? null,
      enabled: dto.enabled ?? true,
    });
  }

  async deleteDevice(id: string): Promise<void> {
    await this.deviceModel.findByIdAndDelete(id).exec();
    const registers = await this.registerModel.find({ deviceId: id }).select('_id').exec();
    const regIds = registers.map((r) => r._id.toString());
    await this.registerModel.deleteMany({ deviceId: id }).exec();
    if (regIds.length > 0) {
      await this.stateModel.deleteMany({ registerId: { $in: regIds } }).exec();
    }
  }

  // ─── Registers ────────────────────────────────────────────────────────────

  async listRegisters(deviceId: string): Promise<ModbusRegisterDocument[]> {
    return this.registerModel.find({ deviceId }).sort({ address: 1 }).exec();
  }

  async findRegister(id: string): Promise<ModbusRegisterDocument | null> {
    return this.registerModel.findById(id).exec();
  }

  async createRegister(
    deviceId: string,
    dto: CreateModbusRegisterDto,
  ): Promise<ModbusRegisterDocument> {
    return this.registerModel.create({
      deviceId,
      name: dto.name,
      registerType: dto.registerType,
      address: dto.address,
      count: dto.count ?? 1,
      unit: dto.unit ?? null,
      scaleFactor: dto.scaleFactor ?? 1.0,
      offset: dto.offset ?? 0.0,
      writable: dto.writable ?? false,
    });
  }

  async deleteRegister(id: string): Promise<void> {
    await this.registerModel.findByIdAndDelete(id).exec();
    await this.stateModel.deleteOne({ registerId: id }).exec();
  }

  // ─── State ────────────────────────────────────────────────────────────────

  async upsertState(
    registerId: string,
    rawValues: number[],
    scaledValues: number[],
  ): Promise<void> {
    await this.stateModel
      .updateOne(
        { registerId },
        { $set: { rawValues, scaledValues, timestamp: new Date() } },
        { upsert: true },
      )
      .exec();
  }

  async getState(registerId: string): Promise<ModbusRegisterStateDocument | null> {
    return this.stateModel.findOne({ registerId }).exec();
  }

  async getDeviceStates(deviceId: string): Promise<ModbusRegisterStateDocument[]> {
    const registers = await this.registerModel.find({ deviceId }).select('_id').exec();
    const regIds = registers.map((r) => r._id.toString());
    return this.stateModel.find({ registerId: { $in: regIds } }).exec();
  }
}
