import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import type { RegisterType } from '../../mongo/schemas/modbus-register.mongo';
import {
  createModbusDeviceSchema,
  createModbusRegisterSchema,
  updateModbusDeviceSchema,
  writeModbusRegisterSchema,
} from '../schemas/modbus.schema';

export class CreateModbusDeviceDto extends createZodDto(
  createModbusDeviceSchema,
) {}

export class UpdateModbusDeviceDto extends createZodDto(
  updateModbusDeviceSchema,
) {}

export class CreateModbusRegisterDto extends createZodDto(
  createModbusRegisterSchema,
) {}

export class WriteModbusRegisterDto extends createZodDto(
  writeModbusRegisterSchema,
) {}

export class ModbusDeviceResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() slaveId: number;
  @ApiPropertyOptional() description?: string | null;
  @ApiProperty() enabled: boolean;
  @ApiPropertyOptional() houseId?: string | null;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}

export class ModbusRegisterResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() deviceId: string;
  @ApiProperty() name: string;
  @ApiProperty({ enum: ['holding', 'input', 'coil', 'discrete'] }) registerType: RegisterType;
  @ApiProperty() address: number;
  @ApiProperty() count: number;
  @ApiPropertyOptional() unit?: string | null;
  @ApiProperty() scaleFactor: number;
  @ApiProperty() offset: number;
  @ApiProperty() writable: boolean;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}

export class ModbusRegisterStateResponseDto {
  @ApiProperty() registerId: string;
  @ApiProperty({ type: [Number] }) rawValues: number[];
  @ApiProperty({ type: [Number] }) scaledValues: number[];
  @ApiProperty() timestamp: string;
}
