import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DeviceFunctionsService } from '../device-functions/device-functions.service';
import { DeviceFunctionResponse } from '../devices/dto/device-response.dto';
import { PageResponse } from '../devices/dto/page-response.dto';
import { DeviceFunctionRequest } from '../devices/dto/device-function-request.dto';

@ApiTags('Admin — device functions')
@Controller('admin/device-functions')
export class AdminDeviceFunctionsController {
  constructor(private readonly service: DeviceFunctionsService) {}

  @Get('by-device/:deviceId/all')
  @ApiOperation({ summary: 'Все функции устройства (админ)' })
  @ApiParam({ name: 'deviceId', description: 'ID устройства' })
  @ApiOkResponse({ description: 'Массив функций' })
  findAllByDeviceId(@Param('deviceId') deviceId: string): Promise<DeviceFunctionResponse[]> {
    return this.service.findByDeviceId(Number(deviceId));
  }

  @Get('by-device/:deviceId')
  @ApiOperation({ summary: 'Функции устройства (админ, постранично)' })
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

  @Get(':id')
  @ApiOperation({ summary: 'Функция по ID (админ)' })
  @ApiParam({ name: 'id', description: 'ID функции' })
  @ApiOkResponse({ description: 'Функция' })
  findById(@Param('id') id: string): Promise<DeviceFunctionResponse> {
    return this.service.findById(Number(id));
  }

  @Post()
  @ApiOperation({ summary: 'Создать функцию устройства' })
  @ApiBody({ type: DeviceFunctionRequest })
  @ApiOkResponse({ description: 'Созданная функция' })
  create(@Body() body: DeviceFunctionRequest): Promise<DeviceFunctionResponse> {
    return this.service.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Обновить функцию устройства' })
  @ApiParam({ name: 'id', description: 'ID функции' })
  @ApiBody({ type: DeviceFunctionRequest })
  @ApiOkResponse({ description: 'Обновлённая функция' })
  update(
    @Param('id') id: string,
    @Body() body: DeviceFunctionRequest,
  ): Promise<DeviceFunctionResponse> {
    return this.service.update(Number(id), body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить функцию устройства' })
  @ApiParam({ name: 'id', description: 'ID функции' })
  @ApiResponse({ status: 200, description: 'Удалено' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.service.delete(Number(id));
  }
}
