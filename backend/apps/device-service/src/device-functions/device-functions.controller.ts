import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DeviceFunctionsService } from './device-functions.service';
import { DeviceFunctionResponse } from '../devices/dto/device-response.dto';
import { PageResponse } from '../devices/dto/page-response.dto';

@ApiTags('Device functions')
@Controller('api/v1/device-functions')
export class DeviceFunctionsController {
  constructor(private readonly service: DeviceFunctionsService) {}

  @Get('by-device/:deviceId/all')
  @ApiOperation({ summary: 'Все функции устройства' })
  @ApiParam({ name: 'deviceId', description: 'ID устройства' })
  @ApiOkResponse({ description: 'Массив функций' })
  findAllByDeviceId(@Param('deviceId') deviceId: string): Promise<DeviceFunctionResponse[]> {
    return this.service.findByDeviceId(Number(deviceId));
  }

  @Get('by-device/:deviceId/writable')
  @ApiOperation({ summary: 'Функции устройства с возможностью записи значения' })
  @ApiParam({ name: 'deviceId', description: 'ID устройства' })
  @ApiOkResponse({ description: 'Массив функций' })
  findWritableFunctions(@Param('deviceId') deviceId: string): Promise<DeviceFunctionResponse[]> {
    return this.service.findWritableFunctions(Number(deviceId));
  }

  @Get('by-device/:deviceId')
  @ApiOperation({ summary: 'Функции устройства (постранично)' })
  @ApiParam({ name: 'deviceId', description: 'ID устройства' })
  @ApiQuery({ name: 'page', required: false, example: 0 })
  @ApiQuery({ name: 'size', required: false, example: 20 })
  @ApiOkResponse({ description: 'Страница функций', type: PageResponse })
  findByDeviceId(
    @Param('deviceId') deviceId: string,
    @Query('page') page = 0,
    @Query('size') size = 20,
  ): Promise<PageResponse<DeviceFunctionResponse>> {
    const p = Number(page) || 0;
    const s = Number(size) || 20;
    return this.service.findByDeviceIdPaged(Number(deviceId), p, s);
  }

  @Get(':id/detailed')
  @ApiOperation({ summary: 'Функция по ID (детально)' })
  @ApiParam({ name: 'id', description: 'ID функции' })
  @ApiOkResponse({ description: 'Функция' })
  findByIdDetailed(@Param('id') id: string): Promise<DeviceFunctionResponse> {
    return this.service.findByIdDetailed(Number(id));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Функция по ID' })
  @ApiParam({ name: 'id', description: 'ID функции' })
  @ApiOkResponse({ description: 'Функция' })
  findById(@Param('id') id: string): Promise<DeviceFunctionResponse> {
    return this.service.findById(Number(id));
  }

  @Patch(':id/value')
  @ApiOperation({ summary: 'Обновить текущее значение функции' })
  @ApiParam({ name: 'id', description: 'ID функции' })
  @ApiQuery({ name: 'value', description: 'Новое значение (строка)' })
  @ApiOkResponse({ description: 'Обновлённая функция' })
  updateValue(@Param('id') id: string, @Query('value') value: string): Promise<DeviceFunctionResponse> {
    return this.service.updateValue(Number(id), value);
  }
}
