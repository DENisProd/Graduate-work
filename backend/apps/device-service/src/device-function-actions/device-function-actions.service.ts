import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeviceFunctionActionResponse, TranslationResponse } from '../devices/dto/device-response.dto';
import { PageResponse } from '../devices/dto/page-response.dto';
import { DeviceFunctionActionRequest } from '../devices/dto/device-function-action-request.dto';

@Injectable()
export class DeviceFunctionActionsService {
  constructor(private readonly prisma: PrismaService) {}

  private toResponse(entity: any): DeviceFunctionActionResponse {
    const translations =
      entity.translations?.reduce(
        (acc: Record<string, TranslationResponse>, t: any) => {
          acc[t.locale] = { name: t.name, description: t.description };
          return acc;
        },
        {},
      ) ?? null;

    return {
      id: entity.id,
      code: entity.code,
      name: entity.translations?.[0]?.name ?? '',
      description: entity.translations?.[0]?.description ?? null,
      deviceFunctionId: entity.deviceFunctionId,
      actionType: entity.actionType,
      payloadTemplate: entity.payloadTemplate,
      active: entity.active,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      translations,
    };
  }

  async findByFunctionId(functionId: number): Promise<DeviceFunctionActionResponse[]> {
    const items = await this.prisma.deviceFunctionAction.findMany({
      where: { active: true, deviceFunctionId: functionId },
      include: { translations: true },
      orderBy: { createdAt: 'desc' },
    });
    return items.map((a) => this.toResponse(a));
  }

  async findByFunctionIdPaged(
    functionId: number,
    page: number,
    size: number,
  ): Promise<PageResponse<DeviceFunctionActionResponse>> {
    const [items, totalElements] = await this.prisma.$transaction([
      this.prisma.deviceFunctionAction.findMany({
        skip: page * size,
        take: size,
        where: { active: true, deviceFunctionId: functionId },
        include: { translations: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.deviceFunctionAction.count({
        where: { active: true, deviceFunctionId: functionId },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalElements / size || 1));

    return new PageResponse<DeviceFunctionActionResponse>({
      content: items.map((a) => this.toResponse(a)),
      page,
      size,
      totalElements,
      totalPages,
      first: page === 0,
      last: page + 1 >= totalPages,
      hasNext: page + 1 < totalPages,
      hasPrevious: page > 0,
    });
  }

  async findByDeviceId(deviceId: number): Promise<DeviceFunctionActionResponse[]> {
    const items = await this.prisma.deviceFunctionAction.findMany({
      where: { active: true, deviceFunction: { deviceId } },
      include: { translations: true },
      orderBy: { createdAt: 'desc' },
    });
    return items.map((a) => this.toResponse(a));
  }

  async findByDeviceIdPaged(
    deviceId: number,
    page: number,
    size: number,
  ): Promise<PageResponse<DeviceFunctionActionResponse>> {
    const [items, totalElements] = await this.prisma.$transaction([
      this.prisma.deviceFunctionAction.findMany({
        skip: page * size,
        take: size,
        where: { active: true, deviceFunction: { deviceId } },
        include: { translations: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.deviceFunctionAction.count({
        where: { active: true, deviceFunction: { deviceId } },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalElements / size || 1));

    return new PageResponse<DeviceFunctionActionResponse>({
      content: items.map((a) => this.toResponse(a)),
      page,
      size,
      totalElements,
      totalPages,
      first: page === 0,
      last: page + 1 >= totalPages,
      hasNext: page + 1 < totalPages,
      hasPrevious: page > 0,
    });
  }

  async findById(id: number): Promise<DeviceFunctionActionResponse> {
    const entity = await this.prisma.deviceFunctionAction.findUnique({
      where: { id },
      include: { translations: true },
    });
    if (!entity) {
      throw new NotFoundException('Device function action not found');
    }
    return this.toResponse(entity);
  }

  async execute(id: number): Promise<DeviceFunctionActionResponse> {
    const entity = await this.prisma.deviceFunctionAction.findUnique({
      where: { id },
      include: { translations: true },
    });
    if (!entity) {
      throw new NotFoundException('Device function action not found');
    }
    // Здесь в будущем можно добавить отправку команды на устройство
    return this.toResponse(entity);
  }

  async findByFunctionIdFull(
    functionId: number,
    page?: number,
    size?: number,
  ): Promise<PageResponse<DeviceFunctionActionResponse> | DeviceFunctionActionResponse[]> {
    if (page !== undefined && size !== undefined) {
      return this.findByFunctionIdPaged(functionId, page, size);
    }
    return this.findByFunctionId(functionId);
  }

  async findByDeviceIdFull(
    deviceId: number,
    page?: number,
    size?: number,
  ): Promise<PageResponse<DeviceFunctionActionResponse> | DeviceFunctionActionResponse[]> {
    if (page !== undefined && size !== undefined) {
      return this.findByDeviceIdPaged(deviceId, page, size);
    }
    return this.findByDeviceId(deviceId);
  }

  async findByIdFull(id: number): Promise<DeviceFunctionActionResponse> {
    return this.findById(id);
  }

  async create(request: DeviceFunctionActionRequest): Promise<DeviceFunctionActionResponse> {
    const created = await this.prisma.deviceFunctionAction.create({
      data: {
        code: request.code,
        deviceFunction: { connect: { id: request.deviceFunctionId } },
        actionType: request.actionType,
        payloadTemplate: request.payloadTemplate,
        active: request.active ?? true,
        translations: {
          create: Object.entries(request.translations).map(([locale, t]) => ({
            locale,
            name: t.name,
            description: t.description ?? null,
          })),
        },
      },
      include: { translations: true },
    });
    return this.toResponse(created);
  }

  async update(
    id: number,
    request: DeviceFunctionActionRequest,
  ): Promise<DeviceFunctionActionResponse> {
    await this.ensureExists(id);
    const updated = await this.prisma.deviceFunctionAction.update({
      where: { id },
      data: {
        code: request.code,
        deviceFunction: { connect: { id: request.deviceFunctionId } },
        actionType: request.actionType,
        payloadTemplate: request.payloadTemplate ?? undefined,
        active: request.active ?? undefined,
      },
      include: { translations: true },
    });
    return this.toResponse(updated);
  }

  async delete(id: number): Promise<void> {
    await this.prisma.deviceFunctionAction.update({
      where: { id },
      data: { active: false },
    });
  }

  private async ensureExists(id: number): Promise<void> {
    const exists = await this.prisma.deviceFunctionAction.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException('Device function action not found');
    }
  }
}

