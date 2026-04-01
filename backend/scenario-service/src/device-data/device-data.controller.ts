import { Controller, Get, Param, Delete, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { DeviceDataService } from './device-data.service';
import {
  DeviceDataListResponseDto,
  DeviceDataResponseDto,
} from './dto/device-data-response.dto';
import { listDeviceDataQuerySchema } from './schemas/device-data.schema';
import { idParamSchema } from '../common/schemas/id-params';

@ApiTags('Device Data')
@Controller('device-data')
export class DeviceDataController {
  constructor(private readonly service: DeviceDataService) {}

  @Get()
  @ApiOperation({ summary: 'Список данных устройств с пагинацией и фильтрами' })
  @ApiQuery({
    name: 'deviceId',
    required: false,
    description: 'ObjectId физического устройства',
  })
  @ApiQuery({
    name: 'deviceTypeId',
    required: false,
    type: Number,
    description: 'ID типа устройства',
  })
  @ApiQuery({
    name: 'deviceFunction',
    required: false,
    description: 'Функция устройства',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['FLOAT', 'NUMBER', 'STRING', 'BOOLEAN'],
    description: 'Тип данных',
  })
  @ApiQuery({
    name: 'from',
    required: false,
    description: 'Начало периода (ISO 8601)',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    description: 'Конец периода (ISO 8601)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Номер страницы',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Размер страницы (макс. 100)',
  })
  @ApiResponse({
    status: 200,
    description: 'Список записей и общее количество',
    type: DeviceDataListResponseDto,
  })
  findMany(@Query() query: unknown) {
    const q = listDeviceDataQuerySchema.parse(query);
    return this.service.findMany(q);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить запись данных устройства по ID' })
  @ApiParam({ name: 'id', description: 'ObjectId записи' })
  @ApiResponse({
    status: 200,
    description: 'Запись найдена',
    type: DeviceDataResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Запись не найдена' })
  findOne(@Param() params: unknown) {
    const { id } = idParamSchema.parse(params);
    return this.service.findById(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить запись данных устройства' })
  @ApiParam({ name: 'id', description: 'ObjectId записи' })
  @ApiResponse({
    status: 200,
    description: 'Запись удалена',
    type: DeviceDataResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Запись не найдена' })
  remove(@Param() params: unknown) {
    const { id } = idParamSchema.parse(params);
    return this.service.remove(id);
  }
}
