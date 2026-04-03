import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeviceTypeRequest } from '../devices/dto/device-type-request.dto';
import { DeviceTypeResponse, TranslationResponse } from '../devices/dto/device-response.dto';

@Injectable()
export class DeviceTypesService {
  constructor(private readonly prisma: PrismaService) {}

  private toResponse(entity: any): DeviceTypeResponse {
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

  async findAll(): Promise<DeviceTypeResponse[]> {
    const types = await this.prisma.deviceType.findMany({
      where: { active: true },
      include: { translations: true },
      orderBy: { createdAt: 'desc' },
    });
    return types.map((t) => this.toResponse(t));
  }

  async findById(id: number): Promise<DeviceTypeResponse> {
    const type = await this.prisma.deviceType.findUnique({
      where: { id },
      include: { translations: true },
    });
    if (!type) {
      throw new NotFoundException('Device type not found');
    }
    return this.toResponse(type);
  }

  async findByCode(code: string): Promise<DeviceTypeResponse> {
    const type = await this.prisma.deviceType.findUnique({
      where: { code },
      include: { translations: true },
    });
    if (!type) {
      throw new NotFoundException('Device type not found');
    }
    return this.toResponse(type);
  }

  async findAllFull(): Promise<DeviceTypeResponse[]> {
    return this.findAll();
  }

  async findByIdFull(id: number): Promise<DeviceTypeResponse> {
    return this.findById(id);
  }

  async findByCodeFull(code: string): Promise<DeviceTypeResponse> {
    return this.findByCode(code);
  }

  async create(request: DeviceTypeRequest): Promise<DeviceTypeResponse> {
    const created = await this.prisma.deviceType.create({
      data: {
        code: request.code,
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

  async update(id: number, request: DeviceTypeRequest): Promise<DeviceTypeResponse> {
    await this.ensureExists(id);
    const updated = await this.prisma.deviceType.update({
      where: { id },
      data: {
        code: request.code,
        active: request.active ?? undefined,
      },
      include: { translations: true },
    });
    return this.toResponse(updated);
  }

  async delete(id: number): Promise<void> {
    await this.prisma.deviceType.update({
      where: { id },
      data: { active: false },
    });
  }

  private async ensureExists(id: number): Promise<void> {
    const exists = await this.prisma.deviceType.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException('Device type not found');
    }
  }
}

