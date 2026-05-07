import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { DeviceCategoryResponse, DeviceTypeResponse, TranslationResponse } from '../devices/dto/device-response.dto';
import { PageResponse } from '../devices/dto/page-response.dto';
import { DeviceCategoryRequest } from '../devices/dto/device-category-request.dto';

@Injectable()
export class DeviceCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  private toDeviceType(entity: any | null | undefined): DeviceTypeResponse | null {
    if (!entity) return null;
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
      active: entity.active,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      translations,
    };
  }

  private toResponse(entity: any): DeviceCategoryResponse {
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
      deviceType: this.toDeviceType(entity.deviceType),
      active: entity.active,
      isModerated: entity.isModerated,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      translations,
    };
  }

  async findAll(page: number, size: number): Promise<PageResponse<DeviceCategoryResponse>> {
    const [items, totalElements] = await this.prisma.$transaction([
      this.prisma.deviceCategory.findMany({
        skip: page * size,
        take: size,
        where: { active: true },
        include: { translations: true, deviceType: { include: { translations: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.deviceCategory.count({ where: { active: true } }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalElements / size || 1));

    return new PageResponse<DeviceCategoryResponse>({
      content: items.map((c) => this.toResponse(c)),
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

  async findAllList(): Promise<DeviceCategoryResponse[]> {
    const items = await this.prisma.deviceCategory.findMany({
      where: { active: true },
      include: { translations: true, deviceType: { include: { translations: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return items.map((c) => this.toResponse(c));
  }

  async findByDeviceTypeId(deviceTypeId: number): Promise<DeviceCategoryResponse[]> {
    const items = await this.prisma.deviceCategory.findMany({
      where: { active: true, deviceTypeId },
      include: { translations: true, deviceType: { include: { translations: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return items.map((c) => this.toResponse(c));
  }

  async findById(id: number): Promise<DeviceCategoryResponse> {
    const entity = await this.prisma.deviceCategory.findUnique({
      where: { id },
      include: { translations: true, deviceType: { include: { translations: true } } },
    });
    if (!entity) {
      throw new NotFoundException('Device category not found');
    }
    return this.toResponse(entity);
  }

  async findByCode(code: string): Promise<DeviceCategoryResponse> {
    const entity = await this.prisma.deviceCategory.findUnique({
      where: { code },
      include: { translations: true, deviceType: { include: { translations: true } } },
    });
    if (!entity) {
      throw new NotFoundException('Device category not found');
    }
    return this.toResponse(entity);
  }

  async findByDeviceTypeIdFull(deviceTypeId: number): Promise<DeviceCategoryResponse[]> {
    return this.findByDeviceTypeId(deviceTypeId);
  }

  async findAllFull(page?: number, size?: number): Promise<any> {
    if (page !== undefined && size !== undefined) {
      return this.findAll(page, size);
    }
    return this.findAllList();
  }

  async findByIdFull(id: number): Promise<DeviceCategoryResponse> {
    return this.findById(id);
  }

  async findByCodeFull(code: string): Promise<DeviceCategoryResponse> {
    return this.findByCode(code);
  }

  async create(request: DeviceCategoryRequest): Promise<DeviceCategoryResponse> {
    const created = await this.prisma.deviceCategory.create({
      data: {
        code: request.code,
        deviceType: { connect: { id: request.deviceTypeId } },
        active: request.active ?? true,
        isModerated: request.isModerated ?? true,
        translations: {
          create: Object.entries(request.translations).map(([locale, t]) => ({
            locale,
            name: t.name,
            description: t.description ?? null,
          })),
        },
      },
      include: { translations: true, deviceType: { include: { translations: true } } },
    });
    return this.toResponse(created);
  }

  async update(id: number, request: DeviceCategoryRequest): Promise<DeviceCategoryResponse> {
    await this.ensureExists(id);
    const updated = await this.prisma.deviceCategory.update({
      where: { id },
      data: {
        code: request.code,
        deviceType: { connect: { id: request.deviceTypeId } },
        active: request.active ?? undefined,
        ...(request.isModerated !== undefined ? { isModerated: request.isModerated } : {}),
      },
      include: { translations: true, deviceType: { include: { translations: true } } },
    });
    return this.toResponse(updated);
  }

  async delete(id: number): Promise<void> {
    await this.prisma.deviceCategory.update({
      where: { id },
      data: { active: false },
    });
  }

  private async ensureExists(id: number): Promise<void> {
    const exists = await this.prisma.deviceCategory.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException('Device category not found');
    }
  }
}
