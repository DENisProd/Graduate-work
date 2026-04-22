import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PhysicalDeviceService } from './physical-device.service';
import { CreatePhysicalDeviceDto } from './dto/create-physical-device.dto';
import { UpdatePhysicalDeviceDto } from './dto/update-physical-device.dto';
import {
  PhysicalDeviceListResponseDto,
  PhysicalDeviceResponseDto,
} from './dto/physical-device-response.dto';
import { listPhysicalDevicesQuerySchema } from './schemas/physical-device.schema';
import { idParamSchema } from '../common/schemas/id-params';

@ApiTags('Physical Devices')
@Controller('physical-devices')
export class PhysicalDeviceController {
  constructor(private readonly service: PhysicalDeviceService) {}

  @Post()
  @ApiOperation({ summary: 'Создать физическое устройство' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'houseId'],
      properties: {
        name: { type: 'string', maxLength: 255 },
        description: { type: 'string', maxLength: 1000 },
        deviceTypeId: {
          type: 'number',
          minimum: 1,
          description:
            'ID типа устройства из device-service. Если не указан и устройство имеет модель (model), будет определён автоматически.',
        },
        houseId: { type: 'string', maxLength: 255 },
        roomId: { type: 'string', maxLength: 255 },
        firmwareVersion: { type: 'string', maxLength: 100 },
        ipAddress: { type: 'string' },
        macAddress: { type: 'string', maxLength: 17 },
        serialNumber: { type: 'string', maxLength: 100 },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Устройство создано',
    type: PhysicalDeviceResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Ошибка валидации' })
  create(@Body() dto: CreatePhysicalDeviceDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Список устройств с пагинацией и фильтрами' })
  @ApiQuery({
    name: 'houseId',
    required: false,
    type: String,
    description: 'ID дома',
  })
  @ApiQuery({ name: 'roomId', required: false, description: 'ID комнаты' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Номер страницы (по умолчанию 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Размер страницы (по умолчанию 20, макс. 100)',
  })
  @ApiResponse({
    status: 200,
    description: 'Список устройств и общее количество',
    type: PhysicalDeviceListResponseDto,
  })
  findMany(@Query() query: unknown) {
    const q = listPhysicalDevicesQuerySchema.parse(query);
    return this.service.findMany(q);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить устройство по ID' })
  @ApiParam({ name: 'id', description: 'ObjectId устройства' })
  @ApiResponse({
    status: 200,
    description: 'Устройство найдено',
    type: PhysicalDeviceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Устройство не найдено' })
  findOne(@Param() params: unknown) {
    const { id } = idParamSchema.parse(params);
    return this.service.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить устройство' })
  @ApiParam({ name: 'id', description: 'ObjectId устройства' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', maxLength: 255 },
        description: { type: 'string', maxLength: 1000, nullable: true },
        deviceTypeId: { type: 'number', minimum: 1 },
        houseId: { type: 'string', maxLength: 255 },
        roomId: { type: 'string', maxLength: 255, nullable: true },
        firmwareVersion: { type: 'string', maxLength: 100, nullable: true },
        ipAddress: { type: 'string', nullable: true },
        macAddress: { type: 'string', maxLength: 17, nullable: true },
        serialNumber: { type: 'string', maxLength: 100, nullable: true },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Устройство обновлено',
    type: PhysicalDeviceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Устройство не найдено' })
  @ApiResponse({ status: 400, description: 'Ошибка валидации' })
  update(@Param() params: unknown, @Body() dto: UpdatePhysicalDeviceDto) {
    const { id } = idParamSchema.parse(params);
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить устройство' })
  @ApiParam({ name: 'id', description: 'ObjectId устройства' })
  @ApiResponse({
    status: 200,
    description: 'Устройство удалено',
    type: PhysicalDeviceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Устройство не найдено' })
  remove(@Param() params: unknown) {
    const { id } = idParamSchema.parse(params);
    return this.service.remove(id);
  }
}
