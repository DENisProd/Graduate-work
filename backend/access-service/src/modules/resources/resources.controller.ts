import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto/create-resource.dto';
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
  @ApiOperation({ summary: 'Создать ресурс (ROOM, DEVICE, DEVICE_FUNCTION, ...)' })
  async create(@Body() dto: CreateResourceDto): Promise<ResourceResponseDto> {
    const resource = await this.resourcesService.create(dto);
    return toResponse(resource);
  }

  @Get('resources/:id')
  @ApiOperation({ summary: 'Получить ресурс по ID' })
  async findById(@Param('id') id: string): Promise<ResourceResponseDto> {
    const resource = await this.resourcesService.findById(id);
    return toResponse(resource);
  }

  @Get('houses/:houseId/resources/tree')
  @ApiOperation({ summary: 'Получить дерево ресурсов дома' })
  async getTree(
    @Param('houseId') houseId: string,
  ): Promise<ResourceTreeNodeDto[]> {
    return this.resourcesService.getTreeByHouseId(houseId);
  }
}

