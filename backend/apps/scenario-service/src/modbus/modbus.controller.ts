import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ModbusService } from './modbus.service';
import {
  CreateModbusDeviceDto,
  CreateModbusRegisterDto,
  ModbusDeviceResponseDto,
  ModbusRegisterResponseDto,
  ModbusRegisterStateResponseDto,
  WriteModbusRegisterDto,
} from './dto/modbus.dto';

@ApiTags('Modbus')
@Controller('modbus')
export class ModbusController {
  constructor(private readonly service: ModbusService) {}

  @Get('devices')
  @ApiOperation({ summary: 'List modbus devices' })
  @ApiResponse({ status: 200, type: [ModbusDeviceResponseDto] })
  listDevices(): Promise<ModbusDeviceResponseDto[]> {
    return this.service.listDevices();
  }

  @Post('devices')
  @ApiOperation({ summary: 'Create modbus device' })
  @ApiBody({ type: CreateModbusDeviceDto })
  @ApiResponse({ status: 201, type: ModbusDeviceResponseDto })
  createDevice(@Body() dto: CreateModbusDeviceDto): Promise<ModbusDeviceResponseDto> {
    return this.service.createDevice(dto);
  }

  @Get('devices/:id')
  @ApiOperation({ summary: 'Get modbus device' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: ModbusDeviceResponseDto })
  getDevice(@Param('id') id: string): Promise<ModbusDeviceResponseDto> {
    return this.service.getDevice(id);
  }

  @Delete('devices/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete modbus device' })
  @ApiParam({ name: 'id' })
  deleteDevice(@Param('id') id: string): Promise<void> {
    return this.service.deleteDevice(id);
  }

  @Get('devices/:id/registers')
  @ApiOperation({ summary: 'List registers for device' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: [ModbusRegisterResponseDto] })
  listRegisters(@Param('id') id: string): Promise<ModbusRegisterResponseDto[]> {
    return this.service.listRegisters(id);
  }

  @Post('devices/:id/registers')
  @ApiOperation({ summary: 'Create register for device' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: CreateModbusRegisterDto })
  @ApiResponse({ status: 201, type: ModbusRegisterResponseDto })
  createRegister(
    @Param('id') id: string,
    @Body() dto: CreateModbusRegisterDto,
  ): Promise<ModbusRegisterResponseDto> {
    return this.service.createRegister(id, dto);
  }

  @Delete('devices/:id/registers/:regId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete register' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'regId' })
  deleteRegister(
    @Param('id') id: string,
    @Param('regId') regId: string,
  ): Promise<void> {
    return this.service.deleteRegister(id, regId);
  }

  @Post('devices/:id/registers/:regId/read')
  @ApiOperation({ summary: 'Read register via MQTT bridge' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'regId' })
  @ApiResponse({ status: 200, type: ModbusRegisterStateResponseDto })
  readRegister(
    @Param('id') id: string,
    @Param('regId') regId: string,
  ): Promise<ModbusRegisterStateResponseDto> {
    return this.service.readRegister(id, regId);
  }

  @Post('devices/:id/registers/:regId/write')
  @HttpCode(204)
  @ApiOperation({ summary: 'Write register via MQTT bridge' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'regId' })
  @ApiBody({ type: WriteModbusRegisterDto })
  writeRegister(
    @Param('id') id: string,
    @Param('regId') regId: string,
    @Body() dto: WriteModbusRegisterDto,
  ): Promise<void> {
    return this.service.writeRegister(id, regId, dto);
  }

  @Get('devices/:id/state')
  @ApiOperation({ summary: 'Get cached state for all registers of a device' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: [ModbusRegisterStateResponseDto] })
  getDeviceStates(@Param('id') id: string): Promise<ModbusRegisterStateResponseDto[]> {
    return this.service.getDeviceStates(id);
  }
}
