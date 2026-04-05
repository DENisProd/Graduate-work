import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { DeviceTypesService } from './device-types.service';
import { DeviceTypeResponse } from '../devices/dto/device-response.dto';

@ApiTags('Device types')
@Controller('api/v1/device-types')
export class DeviceTypesController {
  constructor(private readonly deviceTypesService: DeviceTypesService) {}

  @Get()
  @ApiOperation({ summary: 'Список типов устройств' })
  @ApiOkResponse({ description: 'Массив типов' })
  findAll(): Promise<DeviceTypeResponse[]> {
    return this.deviceTypesService.findAll();
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Тип устройства по коду' })
  @ApiParam({ name: 'code', example: 'SENSOR' })
  @ApiOkResponse({ description: 'Тип устройства' })
  findByCode(@Param('code') code: string): Promise<DeviceTypeResponse> {
    return this.deviceTypesService.findByCode(code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Тип устройства по ID' })
  @ApiParam({ name: 'id', description: 'ID типа' })
  @ApiOkResponse({ description: 'Тип устройства' })
  findById(@Param('id') id: string): Promise<DeviceTypeResponse> {
    return this.deviceTypesService.findById(Number(id));
  }
}
