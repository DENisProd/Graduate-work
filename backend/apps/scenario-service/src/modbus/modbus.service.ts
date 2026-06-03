import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  BadRequestException,
} from '@nestjs/common';
import { ModbusDeviceRepository } from './modbus-device.repository';
import { ModbusGatewayService } from './modbus-gateway.service';
import type {
  CreateModbusDeviceDto,
  CreateModbusRegisterDto,
  ModbusDeviceResponseDto,
  ModbusRegisterResponseDto,
  ModbusRegisterStateResponseDto,
  WriteModbusRegisterDto,
} from './dto/modbus.dto';

function mapDevice(doc: any): ModbusDeviceResponseDto {
  return {
    id: doc._id.toString(),
    name: doc.name,
    slaveId: doc.slaveId,
    description: doc.description ?? null,
    enabled: doc.enabled,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function mapRegister(doc: any): ModbusRegisterResponseDto {
  return {
    id: doc._id.toString(),
    deviceId: doc.deviceId,
    name: doc.name,
    registerType: doc.registerType,
    address: doc.address,
    count: doc.count,
    unit: doc.unit ?? null,
    scaleFactor: doc.scaleFactor,
    offset: doc.offset,
    writable: doc.writable,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function mapState(doc: any): ModbusRegisterStateResponseDto {
  return {
    registerId: doc.registerId,
    rawValues: doc.rawValues,
    scaledValues: doc.scaledValues,
    timestamp: doc.timestamp instanceof Date ? doc.timestamp.toISOString() : doc.timestamp,
  };
}

@Injectable()
export class ModbusService {
  constructor(
    private readonly repo: ModbusDeviceRepository,
    private readonly gateway: ModbusGatewayService,
  ) {}

  // ─── Devices ──────────────────────────────────────────────────────────────

  async listDevices(): Promise<ModbusDeviceResponseDto[]> {
    return (await this.repo.listDevices()).map(mapDevice);
  }

  async getDevice(id: string): Promise<ModbusDeviceResponseDto> {
    const doc = await this.repo.findDevice(id);
    if (!doc) throw new NotFoundException(`Modbus device ${id} not found`);
    return mapDevice(doc);
  }

  async createDevice(dto: CreateModbusDeviceDto): Promise<ModbusDeviceResponseDto> {
    return mapDevice(await this.repo.createDevice(dto));
  }

  async deleteDevice(id: string): Promise<void> {
    const doc = await this.repo.findDevice(id);
    if (!doc) throw new NotFoundException(`Modbus device ${id} not found`);
    await this.repo.deleteDevice(id);
  }

  // ─── Registers ────────────────────────────────────────────────────────────

  async listRegisters(deviceId: string): Promise<ModbusRegisterResponseDto[]> {
    await this.getDevice(deviceId);
    return (await this.repo.listRegisters(deviceId)).map(mapRegister);
  }

  async createRegister(
    deviceId: string,
    dto: CreateModbusRegisterDto,
  ): Promise<ModbusRegisterResponseDto> {
    await this.getDevice(deviceId);
    return mapRegister(await this.repo.createRegister(deviceId, dto));
  }

  async deleteRegister(deviceId: string, registerId: string): Promise<void> {
    await this.getDevice(deviceId);
    const reg = await this.repo.findRegister(registerId);
    if (!reg || reg.deviceId !== deviceId) {
      throw new NotFoundException(`Register ${registerId} not found`);
    }
    await this.repo.deleteRegister(registerId);
  }

  // ─── Read / Write ─────────────────────────────────────────────────────────

  async readRegister(
    deviceId: string,
    registerId: string,
  ): Promise<ModbusRegisterStateResponseDto> {
    const device = await this.repo.findDevice(deviceId);
    if (!device) throw new NotFoundException(`Modbus device ${deviceId} not found`);

    const reg = await this.repo.findRegister(registerId);
    if (!reg || reg.deviceId !== deviceId) {
      throw new NotFoundException(`Register ${registerId} not found`);
    }

    if (!this.gateway.isAvailable) {
      throw new ServiceUnavailableException('Modbus gateway not connected');
    }

    const rawValues = await this.gateway.sendCommand({
      action: 'read',
      slave_id: device.slaveId,
      register_type: reg.registerType as any,
      address: reg.address,
      count: reg.count,
    });

    const scaledValues = rawValues.map((v) => v * reg.scaleFactor + reg.offset);
    await this.repo.upsertState(registerId, rawValues, scaledValues);

    return {
      registerId,
      rawValues,
      scaledValues,
      timestamp: new Date().toISOString(),
    };
  }

  async writeRegister(
    deviceId: string,
    registerId: string,
    dto: WriteModbusRegisterDto,
  ): Promise<void> {
    const device = await this.repo.findDevice(deviceId);
    if (!device) throw new NotFoundException(`Modbus device ${deviceId} not found`);

    const reg = await this.repo.findRegister(registerId);
    if (!reg || reg.deviceId !== deviceId) {
      throw new NotFoundException(`Register ${registerId} not found`);
    }
    if (!reg.writable) {
      throw new BadRequestException(`Register ${registerId} is not writable`);
    }

    if (!this.gateway.isAvailable) {
      throw new ServiceUnavailableException('Modbus gateway not connected');
    }

    await this.gateway.sendCommand({
      action: 'write',
      slave_id: device.slaveId,
      register_type: reg.registerType as any,
      address: reg.address,
      count: reg.count,
      value: dto.value,
      values: dto.values,
      coil: dto.coil,
    });
  }

  // ─── State ────────────────────────────────────────────────────────────────

  async getDeviceStates(deviceId: string): Promise<ModbusRegisterStateResponseDto[]> {
    await this.getDevice(deviceId);
    return (await this.repo.getDeviceStates(deviceId)).map(mapState);
  }
}
