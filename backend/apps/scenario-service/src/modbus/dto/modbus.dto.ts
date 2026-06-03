import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import type { RegisterType } from '../../mongo/schemas/modbus-register.mongo';

export class CreateModbusDeviceDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsNumber() @Min(1) slaveId: number;
  @ApiPropertyOptional() @IsString() @IsOptional() description?: string;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() enabled?: boolean;
}

export class ModbusDeviceResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() slaveId: number;
  @ApiPropertyOptional() description?: string | null;
  @ApiProperty() enabled: boolean;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}

export class CreateModbusRegisterDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty({ enum: ['holding', 'input', 'coil', 'discrete'] })
  @IsEnum(['holding', 'input', 'coil', 'discrete'])
  registerType: RegisterType;

  @ApiProperty() @IsNumber() @Min(0) address: number;
  @ApiPropertyOptional() @IsNumber() @IsOptional() count?: number;
  @ApiPropertyOptional() @IsString() @IsOptional() unit?: string;
  @ApiPropertyOptional() @IsNumber() @IsOptional() scaleFactor?: number;
  @ApiPropertyOptional() @IsNumber() @IsOptional() offset?: number;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() writable?: boolean;
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

export class WriteModbusRegisterDto {
  @ApiPropertyOptional() @IsNumber() @IsOptional() value?: number;
  @ApiPropertyOptional({ type: [Number] }) @IsOptional() values?: number[];
  @ApiPropertyOptional() @IsBoolean() @IsOptional() coil?: boolean;
}
