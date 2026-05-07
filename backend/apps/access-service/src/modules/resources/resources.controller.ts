import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { RegisterResourceDto } from './dto/register-resource.dto';
import { ResourceResponseDto } from './dto/resource-response.dto';
import { ResourceTreeNodeDto } from './dto/resource-tree-node.dto';

const toResponse = (r: {
  id: string;
  houseId: string;
  type: string;
  externalId: string | null;
  parentId: string | null;
  path: string;
  depth: number;
  createdAt: Date;
}): ResourceResponseDto => ({
  id: r.id,
  houseId: r.houseId,
  type: r.type as any,
  externalId: r.externalId ?? undefined,
  parentId: r.parentId ?? undefined,
  path: r.path,
  depth: r.depth,
  createdAt: r.createdAt.toISOString(),
});

@ApiTags('Resources')
@Controller()
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post('resources')
  @ApiOperation({
    summary: 'Создать ресурс',
    description: 'Типы: ROOM, DEVICE, DEVICE_FUNCTION и др. (см. enum ResourceType в схеме).',
  })
  @ApiBody({ type: CreateResourceDto })
  @ApiCreatedResponse({ type: ResourceResponseDto })
  async create(@Body() dto: CreateResourceDto): Promise<ResourceResponseDto> {
    const resource = await this.resourcesService.create(dto);
    return toResponse(resource);
  }

  @Post('resources/register')
  @ApiOperation({
    summary: 'Зарегистрировать ресурс (идемпотентно)',
    description: 'Создаёт ресурс под родителем найденным по parentExternalId. Если ресурс уже существует — возвращает его ID.',
  })
  @ApiBody({ type: RegisterResourceDto })
  @ApiCreatedResponse({ schema: { properties: { id: { type: 'string' } } } })
  async register(@Body() dto: RegisterResourceDto): Promise<{ id: string }> {
    return this.resourcesService.registerResource(dto);
  }

  @Get('resources/:id')
  @ApiOperation({ summary: 'Получить ресурс по ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ResourceResponseDto })
  async findById(@Param('id') id: string): Promise<ResourceResponseDto> {
    const resource = await this.resourcesService.findById(id);
    return toResponse(resource);
  }

  @Get('houses/:houseId/resources/tree')
  @ApiOperation({ summary: 'Получить дерево ресурсов дома' })
  @ApiParam({ name: 'houseId', format: 'uuid' })
  @ApiOkResponse({ type: ResourceTreeNodeDto, isArray: true })
  async getTree(
    @Param('houseId') houseId: string,
  ): Promise<ResourceTreeNodeDto[]> {
    return this.resourcesService.getTreeByHouseId(houseId);
  }
}

