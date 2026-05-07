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
import { DevicesService } from '../devices/devices.service';
import { DeviceRequest } from '../devices/dto/device-request.dto';
import { DeviceResponse } from '../devices/dto/device-response.dto';
import { PageResponse } from '../devices/dto/page-response.dto';

@ApiTags('Admin — devices')
@Controller('admin/devices')
export class AdminDevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get()
  @ApiOperation({ summary: 'Список устройств (админ)' })
  @ApiQuery({ name: 'page', required: false, example: 0 })
  @ApiQuery({ name: 'size', required: false, example: 20 })
  @ApiOkResponse({ description: 'Страница устройств', type: PageResponse })
  findAll(
    @Query('page') page = 0,
    @Query('size') size = 20,
  ): Promise<PageResponse<DeviceResponse>> {
    const p = Number(page) || 0;
    const s = Number(size) || 20;
    return this.devicesService.findAll(p, s);
  }

  @Get('by-category/:categoryId')
  @ApiOperation({ summary: 'Устройства по категории (админ)' })
  @ApiParam({ name: 'categoryId', description: 'ID категории' })
  @ApiQuery({ name: 'page', required: false, example: 0 })
  @ApiQuery({ name: 'size', required: false, example: 20 })
  @ApiOkResponse({ description: 'Страница устройств', type: PageResponse })
  findByCategoryId(
    @Param('categoryId') categoryId: string,
    @Query('page') page = 0,
    @Query('size') size = 20,
  ): Promise<PageResponse<DeviceResponse>> {
    const p = Number(page) || 0;
    const s = Number(size) || 20;
    return this.devicesService.findByCategoryId(Number(categoryId), p, s);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Устройство по коду (админ, детально)' })
  @ApiParam({ name: 'code', example: 'SENSOR_01' })
  @ApiOkResponse({ description: 'Устройство' })
  findByCode(@Param('code') code: string): Promise<DeviceResponse> {
    return this.devicesService.findByCode(code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Устройство по ID (админ, детально)' })
  @ApiParam({ name: 'id', description: 'ID устройства' })
  @ApiOkResponse({ description: 'Устройство' })
  findById(@Param('id') id: string): Promise<DeviceResponse> {
    return this.devicesService.findByIdDetailed(Number(id));
  }

  @Post()
  @ApiOperation({ summary: 'Создать устройство (админ)' })
  @ApiBody({ type: DeviceRequest })
  @ApiOkResponse({ description: 'Созданное устройство' })
  create(@Body() body: DeviceRequest): Promise<DeviceResponse> {
    return this.devicesService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Обновить устройство (админ)' })
  @ApiParam({ name: 'id', description: 'ID устройства' })
  @ApiBody({ type: DeviceRequest })
  @ApiOkResponse({ description: 'Обновлённое устройство' })
  update(@Param('id') id: string, @Body() body: DeviceRequest): Promise<DeviceResponse> {
    return this.devicesService.update(Number(id), body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить устройство (админ)' })
  @ApiParam({ name: 'id', description: 'ID устройства' })
  @ApiResponse({ status: 200, description: 'Удалено, тело ответа пустое' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.devicesService.delete(Number(id));
  }
}
