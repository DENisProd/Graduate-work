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
import { DeviceCategoriesService } from '../device-categories/device-categories.service';
import { DeviceCategoryResponse } from '../devices/dto/device-response.dto';
import { PageResponse } from '../devices/dto/page-response.dto';
import { DeviceCategoryRequest } from '../devices/dto/device-category-request.dto';

@ApiTags('Admin — device categories')
@Controller('admin/device-categories')
export class AdminDeviceCategoriesController {
  constructor(private readonly service: DeviceCategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Список категорий (админ, постранично)' })
  @ApiQuery({ name: 'page', required: false, example: 0 })
  @ApiQuery({ name: 'size', required: false, example: 20 })
  @ApiOkResponse({ description: 'Страница категорий', type: PageResponse })
  findAll(
    @Query('page') page = 0,
    @Query('size') size = 20,
  ): Promise<PageResponse<DeviceCategoryResponse>> {
    const p = Number(page) || 0;
    const s = Number(size) || 20;
    return this.service.findAll(p, s);
  }

  @Get('all')
  @ApiOperation({ summary: 'Все категории (админ, полные сущности)' })
  @ApiOkResponse({ description: 'Массив категорий' })
  findAllList(): Promise<DeviceCategoryResponse[]> {
    return this.service.findAllFull();
  }

  @Get('by-type/:deviceTypeId')
  @ApiOperation({ summary: 'Категории по типу устройства (админ)' })
  @ApiParam({ name: 'deviceTypeId', description: 'ID типа' })
  @ApiOkResponse({ description: 'Массив категорий' })
  findByDeviceTypeId(@Param('deviceTypeId') deviceTypeId: string): Promise<DeviceCategoryResponse[]> {
    return this.service.findByDeviceTypeIdFull(Number(deviceTypeId));
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Категория по коду (админ)' })
  @ApiParam({ name: 'code', example: 'TEMP_SENSOR' })
  @ApiOkResponse({ description: 'Категория' })
  findByCode(@Param('code') code: string): Promise<DeviceCategoryResponse> {
    return this.service.findByCodeFull(code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Категория по ID (админ)' })
  @ApiParam({ name: 'id', description: 'ID категории' })
  @ApiOkResponse({ description: 'Категория' })
  findById(@Param('id') id: string): Promise<DeviceCategoryResponse> {
    return this.service.findByIdFull(Number(id));
  }

  @Post()
  @ApiOperation({ summary: 'Создать категорию' })
  @ApiBody({ type: DeviceCategoryRequest })
  @ApiOkResponse({ description: 'Созданная категория' })
  create(@Body() body: DeviceCategoryRequest): Promise<DeviceCategoryResponse> {
    return this.service.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Обновить категорию' })
  @ApiParam({ name: 'id', description: 'ID категории' })
  @ApiBody({ type: DeviceCategoryRequest })
  @ApiOkResponse({ description: 'Обновлённая категория' })
  update(
    @Param('id') id: string,
    @Body() body: DeviceCategoryRequest,
  ): Promise<DeviceCategoryResponse> {
    return this.service.update(Number(id), body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить категорию' })
  @ApiParam({ name: 'id', description: 'ID категории' })
  @ApiResponse({ status: 200, description: 'Удалено' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.service.delete(Number(id));
  }
}
