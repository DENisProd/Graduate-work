import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DeviceCategoriesService } from './device-categories.service';
import { DeviceCategoryResponse } from '../devices/dto/device-response.dto';
import { PageResponse } from '../devices/dto/page-response.dto';

@ApiTags('Device categories')
@Controller('api/v1/device-categories')
export class DeviceCategoriesController {
  constructor(private readonly service: DeviceCategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Список категорий (постранично)' })
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
  @ApiOperation({ summary: 'Все категории списком' })
  @ApiOkResponse({ description: 'Массив категорий' })
  findAllList(): Promise<DeviceCategoryResponse[]> {
    return this.service.findAllList();
  }

  @Get('by-type/:deviceTypeId')
  @ApiOperation({ summary: 'Категории по типу устройства' })
  @ApiParam({ name: 'deviceTypeId', description: 'ID типа устройства' })
  @ApiOkResponse({ description: 'Массив категорий' })
  findByDeviceTypeId(@Param('deviceTypeId') deviceTypeId: string): Promise<DeviceCategoryResponse[]> {
    return this.service.findByDeviceTypeId(Number(deviceTypeId));
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Категория по коду' })
  @ApiParam({ name: 'code', example: 'TEMP_SENSOR' })
  @ApiOkResponse({ description: 'Категория' })
  findByCode(@Param('code') code: string): Promise<DeviceCategoryResponse> {
    return this.service.findByCode(code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Категория по ID' })
  @ApiParam({ name: 'id', description: 'ID категории' })
  @ApiOkResponse({ description: 'Категория' })
  findById(@Param('id') id: string): Promise<DeviceCategoryResponse> {
    return this.service.findById(Number(id));
  }
}
