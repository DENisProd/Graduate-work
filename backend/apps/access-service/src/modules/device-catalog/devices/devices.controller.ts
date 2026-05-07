import { Body, Controller, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DevicesService } from './devices.service';
import { DeviceStatus } from './device-status.enum';
import { DeviceRequest } from './dto/device-request.dto';
import { DeviceResponse } from './dto/device-response.dto';
import { PageResponse } from './dto/page-response.dto';

@ApiTags('Devices')
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get()
  @ApiOperation({ summary: 'Список устройств (постранично)' })
  @ApiQuery({ name: 'page', required: false, example: 0, description: 'Номер страницы (с 0)' })
  @ApiQuery({ name: 'size', required: false, example: 20, description: 'Размер страницы' })
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
  @ApiOperation({ summary: 'Устройства по категории' })
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
    const id = Number(categoryId);
    return this.devicesService.findByCategoryId(id, p, s);
  }

  @Get(':id/detailed')
  @ApiOperation({ summary: 'Устройство по ID (детально, с вложениями)' })
  @ApiParam({ name: 'id', description: 'ID устройства' })
  @ApiOkResponse({ description: 'Устройство' })
  findByIdDetailed(@Param('id') id: string): Promise<DeviceResponse> {
    return this.devicesService.findByIdDetailed(Number(id));
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Устройство по коду' })
  @ApiParam({ name: 'code', example: 'SENSOR_01' })
  @ApiOkResponse({ description: 'Устройство' })
  findByCode(@Param('code') code: string): Promise<DeviceResponse> {
    return this.devicesService.findByCode(code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Устройство по ID' })
  @ApiParam({ name: 'id', description: 'ID устройства' })
  @ApiOkResponse({ description: 'Устройство' })
  findById(@Param('id') id: string): Promise<DeviceResponse> {
    return this.devicesService.findById(Number(id));
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Обновить статус устройства' })
  @ApiParam({ name: 'id', description: 'ID устройства' })
  @ApiQuery({ name: 'status', enum: DeviceStatus, description: 'Новый статус' })
  @ApiOkResponse({ description: 'Обновлённое устройство' })
  updateStatus(
    @Param('id') id: string,
    @Query('status') status: DeviceStatus,
  ): Promise<DeviceResponse> {
    return this.devicesService.updateStatus(Number(id), status);
  }

  @Post()
  @ApiOperation({ summary: 'Создать устройство' })
  @ApiBody({ type: DeviceRequest })
  @ApiOkResponse({ description: 'Созданное устройство' })
  create(@Body() body: DeviceRequest): Promise<DeviceResponse> {
    return this.devicesService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Полное обновление устройства' })
  @ApiParam({ name: 'id', description: 'ID устройства' })
  @ApiBody({ type: DeviceRequest })
  @ApiOkResponse({ description: 'Обновлённое устройство' })
  update(@Param('id') id: string, @Body() body: DeviceRequest): Promise<DeviceResponse> {
    return this.devicesService.update(Number(id), body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Мягкое удаление устройства (деактивация)' })
  @ApiParam({ name: 'id', description: 'ID устройства' })
  @ApiResponse({ status: 200, description: 'Тело ответа пустое' })
  softDelete(@Param('id') id: string): Promise<void> {
    return this.devicesService.delete(Number(id));
  }
}
