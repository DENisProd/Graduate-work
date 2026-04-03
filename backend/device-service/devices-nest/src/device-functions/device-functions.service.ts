import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeviceFunctionActionResponse, DeviceFunctionResponse, TranslationResponse } from '../devices/dto/device-response.dto';
import { PageResponse } from '../devices/dto/page-response.dto';
import { DeviceFunctionRequest } from '../devices/dto/device-function-request.dto';

@Injectable()
export class DeviceFunctionsService {
  constructor(private readonly prisma: PrismaService) {}

  private toResponse(entity: any): DeviceFunctionResponse {
    const translations =
      entity.translations?.reduce(
        (acc: Record<string, TranslationResponse>, t: any) => {
          acc[t.locale] = { name: t.name, description: t.description };
          return acc;
        },
        {},
      ) ?? null;

    const actions: DeviceFunctionActionResponse[] | null = entity.actions
      ? entity.actions.map((a: any) => ({
          id: a.id,
          code: a.code,
          name: a.translations?.[0]?.name ?? '',
          description: a.translations?.[0]?.description ?? null,
          deviceFunctionId: a.deviceFunctionId,
          actionType: a.actionType,
          payloadTemplate: a.payloadTemplate,
          active: a.active,
          createdAt: a.createdAt,
          updatedAt: a.updatedAt,
          translations:
            a.translations?.reduce(
              (acc2: Record<string, TranslationResponse>, t: any) => {
                acc2[t.locale] = { name: t.name, description: t.description };
                return acc2;
              },
              {},
            ) ?? null,
        }))
      : null;

    return {
      id: entity.id,
      code: entity.code,
      name: entity.translations?.[0]?.name ?? '',
      description: entity.translations?.[0]?.description ?? null,
      deviceId: entity.deviceId,
      functionType: entity.functionType,
      currentValue: entity.currentValue,
      minValue: entity.minValue,
      maxValue: entity.maxValue,
      unit: entity.unit,
      active: entity.active,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      actions,
      translations,
    };
  }

  async findByDeviceId(deviceId: number): Promise<DeviceFunctionResponse[]> {
    const items = await this.prisma.deviceFunction.findMany({
      where: { active: true, deviceId },
      include: { translations: true, actions: { include: { translations: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return items.map((f) => this.toResponse(f));
  }

  async findByDeviceIdPaged(
    deviceId: number,
    page: number,
    size: number,
  ): Promise<PageResponse<DeviceFunctionResponse>> {
    const [items, totalElements] = await this.prisma.$transaction([
      this.prisma.deviceFunction.findMany({
        skip: page * size,
        take: size,
        where: { active: true, deviceId },
        include: { translations: true, actions: { include: { translations: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.deviceFunction.count({ where: { active: true, deviceId } }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalElements / size || 1));

    return new PageResponse<DeviceFunctionResponse>({
      content: items.map((f) => this.toResponse(f)),
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

  async findWritableFunctions(deviceId: number): Promise<DeviceFunctionResponse[]> {
    const items = await this.prisma.deviceFunction.findMany({
      where: {
        active: true,
        deviceId,
        OR: [{ functionType: 'WRITE' }, { functionType: 'READ_WRITE' }],
      },
      include: { translations: true },
      orderBy: { createdAt: 'desc' },
    });
    return items.map((f) => this.toResponse(f));
  }

  async findById(id: number): Promise<DeviceFunctionResponse> {
    const entity = await this.prisma.deviceFunction.findUnique({
      where: { id },
      include: { translations: true, actions: { include: { translations: true } } },
    });
    if (!entity) {
      throw new NotFoundException('Device function not found');
    }
    return this.toResponse(entity);
  }

  async findByIdDetailed(id: number): Promise<DeviceFunctionResponse> {
    const entity = await this.prisma.deviceFunction.findUnique({
      where: { id },
      include: { translations: true, actions: { include: { translations: true } } },
    });
    if (!entity) {
      throw new NotFoundException('Device function not found');
    }
    return this.toResponse(entity);
  }

  async updateValue(id: number, value: string): Promise<DeviceFunctionResponse> {
    const updated = await this.prisma.deviceFunction.update({
      where: { id },
      data: { currentValue: value },
      include: { translations: true, actions: { include: { translations: true } } },
    });
    return this.toResponse(updated);
  }

  async findByDeviceIdFull(deviceId: number): Promise<DeviceFunctionResponse[]> {
    return this.findByDeviceId(deviceId);
  }

  async findByDeviceIdFullPaged(
    deviceId: number,
    page: number,
    size: number,
  ): Promise<PageResponse<DeviceFunctionResponse>> {
    return this.findByDeviceIdPaged(deviceId, page, size);
  }

  async findByIdFull(id: number): Promise<DeviceFunctionResponse> {
    return this.findByIdDetailed(id);
  }

  async create(request: DeviceFunctionRequest): Promise<DeviceFunctionResponse> {
    const created = await this.prisma.deviceFunction.create({
      data: {
        code: request.code,
        device: { connect: { id: request.deviceId } },
        functionType: request.functionType,
        currentValue: request.currentValue,
        minValue: request.minValue,
        maxValue: request.maxValue,
        unit: request.unit,
        active: request.active ?? true,
        translations: {
          create: Object.entries(request.translations).map(([locale, t]) => ({
            locale,
            name: t.name,
            description: t.description ?? null,
          })),
        },
      },
      include: { translations: true, actions: { include: { translations: true } } },
    });
    return this.toResponse(created);
  }

  async update(id: number, request: DeviceFunctionRequest): Promise<DeviceFunctionResponse> {
    await this.ensureExists(id);
    const updated = await this.prisma.deviceFunction.update({
      where: { id },
      data: {
        code: request.code,
        device: { connect: { id: request.deviceId } },
        functionType: request.functionType,
        currentValue: request.currentValue ?? undefined,
        minValue: request.minValue ?? undefined,
        maxValue: request.maxValue ?? undefined,
        unit: request.unit ?? undefined,
        active: request.active ?? undefined,
      },
      include: { translations: true, actions: { include: { translations: true } } },
    });
    return this.toResponse(updated);
  }

  async delete(id: number): Promise<void> {
    await this.prisma.deviceFunction.update({
      where: { id },
      data: { active: false },
    });
  }

  private async ensureExists(id: number): Promise<void> {
    const exists = await this.prisma.deviceFunction.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException('Device function not found');
    }
  }
}

