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
import { ScenarioExecutionService } from './scenario-execution.service';
import { CreateScenarioExecutionDto } from './dto/create-scenario-execution.dto';
import { UpdateScenarioExecutionDto } from './dto/update-scenario-execution.dto';
import {
  ScenarioExecutionListResponseDto,
  ScenarioExecutionResponseDto,
} from './dto/scenario-execution-response.dto';
import { listScenarioExecutionsQuerySchema } from './schemas/scenario-execution.schema';
import { idParamSchema } from '../common/schemas/id-params';

@ApiTags('Scenario Executions')
@Controller('scenario-executions')
export class ScenarioExecutionController {
  constructor(private readonly service: ScenarioExecutionService) {}

  @Post()
  @ApiOperation({ summary: 'Создать запись выполнения сценария' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['scenarioId', 'status', 'triggeredBy', 'triggerData'],
      properties: {
        scenarioId: { type: 'string' },
        status: {
          type: 'string',
          enum: ['RUNNING', 'SUCCESS', 'FAILURE'],
          default: 'RUNNING',
        },
        triggeredBy: {
          type: 'string',
          enum: ['SCHEDULE', 'MANUAL', 'AUTOMATIC', 'SYSTEM', 'API'],
        },
        triggerData: { type: 'object' },
        errorMessage: { type: 'string', maxLength: 2000 },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Запись выполнения создана',
    type: ScenarioExecutionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Ошибка валидации' })
  create(@Body() dto: CreateScenarioExecutionDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Список выполнений сценариев с пагинацией и фильтрами',
  })
  @ApiQuery({ name: 'scenarioId', required: false, description: 'ID сценария' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['RUNNING', 'SUCCESS', 'FAILURE'],
    description: 'Статус выполнения',
  })
  @ApiQuery({
    name: 'triggeredBy',
    required: false,
    enum: ['SCHEDULE', 'MANUAL', 'AUTOMATIC', 'SYSTEM', 'API'],
    description: 'Источник запуска',
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
    description: 'Список выполнений и общее количество',
    type: ScenarioExecutionListResponseDto,
  })
  findMany(@Query() query: unknown) {
    const q = listScenarioExecutionsQuerySchema.parse(query);
    return this.service.findMany(q);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить выполнение сценария по ID' })
  @ApiParam({ name: 'id', description: 'ObjectId записи выполнения' })
  @ApiResponse({
    status: 200,
    description: 'Запись выполнения найдена',
    type: ScenarioExecutionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Запись не найдена' })
  findOne(@Param() params: unknown) {
    const { id } = idParamSchema.parse(params);
    return this.service.findById(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Обновить запись выполнения (например, статус или endedAt)',
  })
  @ApiParam({ name: 'id', description: 'ObjectId записи выполнения' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['RUNNING', 'SUCCESS', 'FAILURE'] },
        errorMessage: { type: 'string', maxLength: 2000, nullable: true },
        endedAt: { type: 'string', format: 'date-time', nullable: true },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Запись обновлена',
    type: ScenarioExecutionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Запись не найдена' })
  @ApiResponse({ status: 400, description: 'Ошибка валидации' })
  update(@Param() params: unknown, @Body() dto: UpdateScenarioExecutionDto) {
    const { id } = idParamSchema.parse(params);
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить запись выполнения' })
  @ApiParam({ name: 'id', description: 'ObjectId записи выполнения' })
  @ApiResponse({
    status: 200,
    description: 'Запись удалена',
    type: ScenarioExecutionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Запись не найдена' })
  remove(@Param() params: unknown) {
    const { id } = idParamSchema.parse(params);
    return this.service.remove(id);
  }
}
