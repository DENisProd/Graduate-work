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
import { ScenarioService } from './scenario.service';
import { CreateScenarioDto } from './dto/create-scenario.dto';
import { UpdateScenarioDto } from './dto/update-scenario.dto';
import {
  ScenarioListResponseDto,
  ScenarioResponseDto,
} from './dto/scenario-response.dto';
import { listScenariosQuerySchema } from './schemas/scenario.schema';
import { idParamSchema } from '../common/schemas/id-params';

@ApiTags('Scenarios')
@Controller('scenarios')
export class ScenarioController {
  constructor(private readonly service: ScenarioService) {}

  @Post()
  @ApiOperation({ summary: 'Создать сценарий' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'status', 'creatorId', 'houseId'],
      properties: {
        name: { type: 'string', maxLength: 255 },
        description: { type: 'string', maxLength: 2000 },
        status: {
          type: 'string',
          enum: ['OFFLINE', 'ONLINE', 'ERROR'],
          default: 'OFFLINE',
        },
        creatorId: { type: 'string', maxLength: 255 },
        houseId: { type: 'string', maxLength: 255 },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Сценарий создан',
    type: ScenarioResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Ошибка валидации' })
  create(@Body() dto: CreateScenarioDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Список сценариев с пагинацией и фильтрами' })
  @ApiQuery({
    name: 'houseId',
    required: false,
    type: String,
    description: 'ID дома',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['OFFLINE', 'ONLINE', 'ERROR'],
    description: 'Статус сценария',
  })
  @ApiQuery({ name: 'creatorId', required: false, description: 'ID создателя' })
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
    description: 'Список сценариев и общее количество',
    type: ScenarioListResponseDto,
  })
  findMany(@Query() query: unknown) {
    const q = listScenariosQuerySchema.parse(query);
    return this.service.findMany(q);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить сценарий по ID' })
  @ApiParam({ name: 'id', description: 'ObjectId сценария' })
  @ApiResponse({
    status: 200,
    description: 'Сценарий найден',
    type: ScenarioResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Сценарий не найден' })
  findOne(@Param() params: unknown) {
    const { id } = idParamSchema.parse(params);
    return this.service.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить сценарий' })
  @ApiParam({ name: 'id', description: 'ObjectId сценария' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', maxLength: 255 },
        description: { type: 'string', maxLength: 2000, nullable: true },
        status: { type: 'string', enum: ['OFFLINE', 'ONLINE', 'ERROR'] },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Сценарий обновлён',
    type: ScenarioResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Сценарий не найден' })
  @ApiResponse({ status: 400, description: 'Ошибка валидации' })
  update(@Param() params: unknown, @Body() dto: UpdateScenarioDto) {
    const { id } = idParamSchema.parse(params);
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить сценарий' })
  @ApiParam({ name: 'id', description: 'ObjectId сценария' })
  @ApiResponse({
    status: 200,
    description: 'Сценарий удалён',
    type: ScenarioResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Сценарий не найден' })
  remove(@Param() params: unknown) {
    const { id } = idParamSchema.parse(params);
    return this.service.remove(id);
  }
}
