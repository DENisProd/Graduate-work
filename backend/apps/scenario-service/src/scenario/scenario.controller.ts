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
import { UserId } from '../common/decorators/user-id.decorator';
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
import { ScenarioStatus } from '../common/schemas/enums';
import {
  scenarioDefinitionExampleHome,
  scenarioDefinitionExampleOffice,
} from './schemas/scenario-definition.schema';

@ApiTags('Scenarios')
@Controller('scenarios')
export class ScenarioController {
  constructor(private readonly service: ScenarioService) {}

  @Post()
  @ApiOperation({ summary: 'Создать сценарий' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'status', 'houseId', 'definition'],
      properties: {
        name: { type: 'string', maxLength: 255 },
        description: { type: 'string', maxLength: 2000 },
        status: {
          type: 'string',
          enum: Object.values(ScenarioStatus),
          default: ScenarioStatus.OFFLINE,
        },
        houseId: { type: 'string', maxLength: 255 },
        definition: {
          type: 'object',
          description:
            'Универсальное определение сценария: scope/triggers/conditions/actions/options (версия 1). Примеры: HOME / OFFICE.',
          additionalProperties: true,
          example: scenarioDefinitionExampleHome,
        },
      },
    },
    examples: {
      HOME: {
        summary: 'Дом: утро по расписанию',
        value: {
          name: 'Утро',
          description: 'Включить свет и климат утром',
          status: ScenarioStatus.ONLINE,
          houseId: 'house_123',
          definition: scenarioDefinitionExampleHome,
        },
      },
      OFFICE: {
        summary: 'Офис: свет по датчику движения',
        value: {
          name: 'Переговорка: движение → свет',
          description: 'Включить свет при движении в рабочее время',
          status: ScenarioStatus.ONLINE,
          houseId: 'office_77',
          definition: scenarioDefinitionExampleOffice,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Сценарий создан',
    type: ScenarioResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Ошибка валидации' })
  create(@Body() dto: CreateScenarioDto, @UserId() creatorId: string) {
    return this.service.create({ ...dto, creatorId });
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
    enum: ScenarioStatus,
    description: 'Статус сценария',
  })
  @ApiQuery({ name: 'creatorId', required: false, description: 'ID создателя' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Номер страницы (начиная с 1)',
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
        status: { type: 'string', enum: Object.values(ScenarioStatus) },
        definition: {
          type: 'object',
          description:
            'Универсальное определение сценария: scope/triggers/conditions/actions/options (версия 1). Примеры: HOME / OFFICE.',
          additionalProperties: true,
          example: scenarioDefinitionExampleOffice,
        },
      },
    },
    examples: {
      RENAME_ONLY: {
        summary: 'Переименовать сценарий',
        value: { name: 'Новый заголовок сценария' },
      },
      UPDATE_DEFINITION: {
        summary: 'Обновить definition (пример OFFICE)',
        value: { definition: scenarioDefinitionExampleOffice },
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
