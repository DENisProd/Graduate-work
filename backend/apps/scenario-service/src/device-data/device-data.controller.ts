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
import { DeviceDataSeriesResponseDto } from './dto/device-data-series.dto';
import {
  deviceDataSeriesQuerySchema,
  listDeviceDataQuerySchema,
} from './schemas/device-data.schema';
import { idParamSchema } from '../common/schemas/id-params';
import { DeviceDataType } from '../common/schemas/enums';

@ApiTags('Device Data')
@Controller('device-data')
export class DeviceDataController {
  constructor(private readonly service: DeviceDataService) {}

  @Get('series')
  @ApiOperation({ summary: 'Серии для графиков (агрегация по времени)' })
  @ApiQuery({ name: 'deviceId', required: true })
  @ApiQuery({ name: 'range', required: true, enum: ['1m', '1h', '6h', '24h', '7d'] })
  @ApiQuery({
    name: 'capabilities',
    required: false,
    description: 'CSV capabilities, e.g. battery,occupancy,zigbee',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    description: 'Anchor end timestamp (ISO). Default: now.',
  })
  @ApiResponse({
    status: 200,
    type: DeviceDataSeriesResponseDto,
  })
  series(@Query() query: unknown) {
    const q = deviceDataSeriesQuerySchema.parse(query);
    return this.service.series(q);
  }

  @Get()
  @ApiOperation({ summary: 'Список данных устройств с пагинацией и фильтрами' })
  @ApiQuery({
    name: 'deviceId',
    required: false,
    description: 'ObjectId физического устройства',
  })
  @ApiQuery({
    name: 'capability',
    required: false,
    description: 'Капабилити (например: temperature_sensor, switch, battery)',
  })
  @ApiQuery({
    name: 'attribute',
    required: false,
    description: 'Атрибут капабилити (например: state, value)',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: DeviceDataType,
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
