import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Resource, ResourceType } from '@prisma/client';
import { ResourceNotFoundException } from '../common/exceptions';
import { CreateResourceDto } from './dto/create-resource.dto';
import { ResourceTreeNodeDto } from './dto/resource-tree-node.dto';

@Injectable()
export class ResourcesService {
  constructor(private readonly prisma: PrismaService) {}

  async createRootForHouse(houseId: string): Promise<{ id: string }> {
    const path = `/${houseId}`;
    const resource = await this.prisma.resource.create({
      data: {
        houseId,
        type: ResourceType.HOUSE,
        path,
        depth: 0,
      },
    });
    return { id: resource.id };
  }

  async create(dto: CreateResourceDto): Promise<Resource> {
    const parent = await this.prisma.resource.findUnique({
      where: { id: dto.parentId },
    });
    if (!parent) {
      throw new ResourceNotFoundException('Ресурс', 'id', dto.parentId);
    }

    // Создаём ресурс с временным path, затем обновляем его, чтобы включить сгенерированный id.
    const created = await this.prisma.resource.create({
      data: {
        houseId: parent.houseId,
        type: dto.type,
        name: dto.name,
        externalId: dto.externalId,
        parentId: parent.id,
        path: parent.path, // временное значение
        depth: parent.depth + 1,
      },
    });

    const path = `${parent.path}/${created.id}`;
    return this.prisma.resource.update({
      where: { id: created.id },
      data: { path },
    });
  }

  async findById(id: string): Promise<Resource> {
    const resource = await this.prisma.resource.findUnique({
      where: { id },
    });
    if (!resource) {
      throw new ResourceNotFoundException('Ресурс', 'id', id);
    }
    return resource;
  }

  async update(id: string, data: { name?: string | null; externalId?: string | null }): Promise<Resource> {
    await this.findById(id);
    const updateData: { name?: string | null; externalId?: string | null } = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.externalId !== undefined) updateData.externalId = data.externalId;
    return this.prisma.resource.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.prisma.resource.delete({ where: { id } });
  }

  /** Найти ресурс типа DEVICE_FUNCTION по id или externalId (deviceFunctionId). */
  async findDeviceFunctionByExternalOrId(deviceFunctionId: string): Promise<Resource> {
    const byId = await this.prisma.resource.findFirst({
      where: { id: deviceFunctionId, type: ResourceType.DEVICE_FUNCTION },
    });
    if (byId) return byId;
    const byExternal = await this.prisma.resource.findFirst({
      where: { externalId: deviceFunctionId, type: ResourceType.DEVICE_FUNCTION },
    });
    if (byExternal) return byExternal;
    throw new ResourceNotFoundException('Функция устройства', 'deviceFunctionId', deviceFunctionId);
  }

  async getTreeByHouseId(houseId: string): Promise<ResourceTreeNodeDto[]> {
    const resources = await this.prisma.resource.findMany({
      where: { houseId },
      orderBy: { depth: 'asc' },
    });

    const nodes = new Map<string, ResourceTreeNodeDto>();
    const roots: ResourceTreeNodeDto[] = [];

    for (const r of resources) {
      const node: ResourceTreeNodeDto = {
        id: r.id,
        houseId: r.houseId,
        type: r.type,
        name: r.name ?? undefined,
        externalId: r.externalId ?? undefined,
        parentId: r.parentId ?? undefined,
        path: r.path,
        depth: r.depth,
        createdAt: r.createdAt.toISOString(),
        children: [],
      };
      nodes.set(r.id, node);
      if (!r.parentId) {
        roots.push(node);
      } else {
        const parent = nodes.get(r.parentId);
        if (parent) {
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      }
    }

    return roots;
  }
}


