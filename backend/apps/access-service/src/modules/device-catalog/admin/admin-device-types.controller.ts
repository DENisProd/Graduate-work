import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DeviceTypesService } from '../device-types/device-types.service';
import { DeviceTypeResponse } from '../devices/dto/device-response.dto';
import { DeviceTypeRequest } from '../devices/dto/device-type-request.dto';

@ApiTags('Admin — device types')
@Controller('admin/device-types')
export class AdminDeviceTypesController {
  constructor(private readonly service: DeviceTypesService) {}

  @Get()
  @ApiOperation({ summary: 'Все типы устройств (админ, полные сущности)' })
  @ApiOkResponse({ description: 'Массив типов' })
  findAll(): Promise<DeviceTypeResponse[]> {
    return this.service.findAllFull();
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Тип по коду (админ)' })
  @ApiParam({ name: 'code', example: 'SENSOR' })
  @ApiOkResponse({ description: 'Тип устройства' })
  findByCode(@Param('code') code: string): Promise<DeviceTypeResponse> {
    return this.service.findByCodeFull(code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Тип по ID (админ)' })
  @ApiParam({ name: 'id', description: 'ID типа' })
  @ApiOkResponse({ description: 'Тип устройства' })
  findById(@Param('id') id: string): Promise<DeviceTypeResponse> {
    return this.service.findByIdFull(Number(id));
  }

  @Post()
  @ApiOperation({ summary: 'Создать тип устройства' })
  @ApiBody({ type: DeviceTypeRequest })
  @ApiOkResponse({ description: 'Созданный тип' })
  create(@Body() body: DeviceTypeRequest): Promise<DeviceTypeResponse> {
    return this.service.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Обновить тип устройства' })
  @ApiParam({ name: 'id', description: 'ID типа' })
  @ApiBody({ type: DeviceTypeRequest })
  @ApiOkResponse({ description: 'Обновлённый тип' })
  update(@Param('id') id: string, @Body() body: DeviceTypeRequest): Promise<DeviceTypeResponse> {
    return this.service.update(Number(id), body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить тип устройства' })
  @ApiParam({ name: 'id', description: 'ID типа' })
  @ApiResponse({ status: 200, description: 'Удалено' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.service.delete(Number(id));
  }
}
