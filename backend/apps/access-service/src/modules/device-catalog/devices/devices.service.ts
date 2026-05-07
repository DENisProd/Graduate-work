import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { DeviceStatus } from './device-status.enum';
import { DeviceRequest } from './dto/device-request.dto';
import { DeviceResponse } from './dto/device-response.dto';
import { PageResponse } from './dto/page-response.dto';

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  private toDeviceResponse(entity: any): DeviceResponse {
    const translationsMap =
      entity.translations?.reduce(
        (acc: Record<string, { name: string; description?: string | null }>, t: any) => {
          acc[t.locale] = { name: t.name, description: t.description };
          return acc;
        },
        {},
      ) ?? null;

    return {
      id: entity.id,
      code: entity.code,
      name: entity.translations?.[0]?.name ?? null,
      description: entity.translations?.[0]?.description ?? null,
      category: entity.deviceCategory
        ? {
            id: entity.deviceCategory.id,
            code: entity.deviceCategory.code,
            name: entity.deviceCategory.translations?.[0]?.name ?? '',
            description: entity.deviceCategory.translations?.[0]?.description ?? null,
            deviceType: null,
            active: entity.deviceCategory.active,
            isModerated: entity.deviceCategory.isModerated,
            createdAt: entity.deviceCategory.createdAt,
            updatedAt: entity.deviceCategory.updatedAt,
            translations:
              entity.deviceCategory.translations?.reduce(
                (acc: Record<string, { name: string; description?: string | null }>, t: any) => {
                  acc[t.locale] = { name: t.name, description: t.description };
                  return acc;
                },
                {},
              ) ?? null,
          }
        : null,
      status: entity.status as DeviceStatus,
      online: entity.status === DeviceStatus.ONLINE,
      serialNumber: entity.serialNumber,
      firmwareVersion: entity.firmwareVersion,
      active: entity.active,
      isModerated: entity.isModerated,
      lastSeenAt: entity.lastSeenAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      functions: null,
      translations: translationsMap,
    };
  }

  async findAll(page: number, size: number): Promise<PageResponse<DeviceResponse>> {
    const [items, totalElements] = await this.prisma.$transaction([
      this.prisma.device.findMany({
        skip: page * size,
        take: size,
        where: { active: true },
        include: {
          translations: true,
          deviceCategory: {
            include: { translations: true, deviceType: { include: { translations: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.device.count({ where: { active: true } }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalElements / size || 1));

    return new PageResponse<DeviceResponse>({
      content: items.map((d) => this.toDeviceResponse(d)),
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

  async findByCategoryId(
    categoryId: number,
    page: number,
    size: number,
  ): Promise<PageResponse<DeviceResponse>> {
    const [items, totalElements] = await this.prisma.$transaction([
      this.prisma.device.findMany({
        skip: page * size,
        take: size,
        where: { active: true, deviceCategoryId: categoryId },
        include: {
          translations: true,
          deviceCategory: {
            include: { translations: true, deviceType: { include: { translations: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.device.count({ where: { active: true, deviceCategoryId: categoryId } }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalElements / size || 1));

    return new PageResponse<DeviceResponse>({
      content: items.map((d) => this.toDeviceResponse(d)),
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

  async findById(id: number): Promise<DeviceResponse> {
    const device = await this.prisma.device.findUnique({
      where: { id },
      include: {
        translations: true,
        deviceCategory: {
          include: { translations: true, deviceType: { include: { translations: true } } },
        },
      },
    });
    if (!device) {
      throw new NotFoundException('Device not found');
    }
    return this.toDeviceResponse(device);
  }

  async findByIdDetailed(id: number): Promise<DeviceResponse> {
    const device = await this.prisma.device.findUnique({
      where: { id },
      include: {
        translations: true,
        functions: {
          include: {
            translations: true,
            actions: { include: { translations: true } },
          },
        },
        deviceCategory: {
          include: { translations: true, deviceType: { include: { translations: true } } },
        },
      },
    });
    if (!device) {
      throw new NotFoundException('Device not found');
    }
    return this.toDeviceResponse(device);
  }

  async findByCode(code: string): Promise<DeviceResponse> {
    const device = await this.prisma.device.findUnique({
      where: { code },
      include: {
        translations: true,
        deviceCategory: {
          include: { translations: true, deviceType: { include: { translations: true } } },
        },
      },
    });
    if (!device) {
      throw new NotFoundException('Device not found');
    }
    return this.toDeviceResponse(device);
  }

  async create(request: DeviceRequest): Promise<DeviceResponse> {
    const created = await this.prisma.device.create({
      data: {
        code: request.code,
        deviceCategory: { connect: { id: request.deviceCategoryId } },
        status: request.status ?? DeviceStatus.OFFLINE,
        serialNumber: request.serialNumber,
        firmwareVersion: request.firmwareVersion,
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
      include: {
        translations: true,
        deviceCategory: {
          include: { translations: true, deviceType: { include: { translations: true } } },
        },
      },
    });
    return this.toDeviceResponse(created);
  }

  async update(id: number, request: DeviceRequest): Promise<DeviceResponse> {
    await this.ensureExists(id);
    const updated = await this.prisma.device.update({
      where: { id },
      data: {
        code: request.code,
        deviceCategory: { connect: { id: request.deviceCategoryId } },
        status: request.status ?? undefined,
        serialNumber: request.serialNumber ?? undefined,
        firmwareVersion: request.firmwareVersion ?? undefined,
        active: request.active ?? undefined,
        ...(request.isModerated !== undefined ? { isModerated: request.isModerated } : {}),
      },
      include: {
        translations: true,
        deviceCategory: {
          include: { translations: true, deviceType: { include: { translations: true } } },
        },
      },
    });
    return this.toDeviceResponse(updated);
  }

  async updateStatus(id: number, status: DeviceStatus): Promise<DeviceResponse> {
    await this.ensureExists(id);
    const updated = await this.prisma.device.update({
      where: { id },
      data: {
        status,
        lastSeenAt: status === DeviceStatus.ONLINE ? new Date() : undefined,
      },
      include: {
        translations: true,
        deviceCategory: {
          include: { translations: true, deviceType: { include: { translations: true } } },
        },
      },
    });
    return this.toDeviceResponse(updated);
  }

  async delete(id: number): Promise<void> {
    await this.prisma.device.update({
      where: { id },
      data: { active: false },
    });
  }

  private async ensureExists(id: number): Promise<void> {
    const exists = await this.prisma.device.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException('Device not found');
    }
  }
}
