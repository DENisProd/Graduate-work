import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CatalogTranslationItemDto,
  EnsureCatalogRequestDto,
} from './dto/ensure-catalog-request.dto';
import { EnsureCatalogResponseDto } from './dto/ensure-catalog-response.dto';

type TranslationCreate = { locale: string; name: string; description: string | null };

function titleFromCode(code: string): string {
  return code
    .toLowerCase()
    .split(/_+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

@Injectable()
export class IntegrationCatalogService {
  private readonly logger = new Logger(IntegrationCatalogService.name);

  constructor(private readonly prisma: PrismaService) {}

  private buildTranslationRows(
    bundle: Record<string, CatalogTranslationItemDto> | undefined,
    code: string,
  ): TranslationCreate[] {
    if (bundle && Object.keys(bundle).length > 0) {
      return Object.entries(bundle).map(([locale, t]) => ({
        locale,
        name: t.name,
        description: t.description ?? null,
      }));
    }
    const name = titleFromCode(code);
    return [
      { locale: 'en', name, description: null },
      { locale: 'ru', name, description: null },
    ];
  }

  private isUniqueConstraint(e: unknown): boolean {
    return e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002';
  }

  async ensureCatalog(dto: EnsureCatalogRequestDto): Promise<EnsureCatalogResponseDto> {
    const t = dto.translations;

    return this.prisma.$transaction(async (tx) => {
      let createdCategory = false;
      let createdDevice = false;

      let category = await tx.deviceCategory.findUnique({
        where: { code: dto.deviceCategoryCode },
      });

      if (!category) {
        let deviceType = await tx.deviceType.findUnique({ where: { code: dto.deviceTypeCode } });
        if (!deviceType) {
          try {
            deviceType = await tx.deviceType.create({
              data: {
                code: dto.deviceTypeCode,
                active: true,
                translations: {
                  create: this.buildTranslationRows(t?.deviceType, dto.deviceTypeCode),
                },
              },
            });
          } catch (e) {
            if (this.isUniqueConstraint(e)) {
              deviceType = await tx.deviceType.findUnique({ where: { code: dto.deviceTypeCode } });
            } else {
              throw e;
            }
            if (!deviceType) {
              this.logger.error('deviceType create race: could not re-load');
              throw e;
            }
          }
        }

        try {
          category = await tx.deviceCategory.create({
            data: {
              code: dto.deviceCategoryCode,
              deviceTypeId: deviceType.id,
              active: true,
              isModerated: false,
              translations: {
                create: this.buildTranslationRows(t?.deviceCategory, dto.deviceCategoryCode),
              },
            },
          });
          createdCategory = true;
        } catch (e) {
          if (this.isUniqueConstraint(e)) {
            category = await tx.deviceCategory.findUnique({ where: { code: dto.deviceCategoryCode } });
            createdCategory = false;
          } else {
            throw e;
          }
          if (!category) {
            this.logger.error('deviceCategory create race: could not re-load');
            throw e;
          }
        }
      }

      let device = await tx.device.findUnique({ where: { code: dto.deviceCode } });
      if (!device) {
        try {
          device = await tx.device.create({
            data: {
              code: dto.deviceCode,
              deviceCategoryId: category.id,
              active: true,
              isModerated: false,
              translations: {
                create: this.buildTranslationRows(t?.device, dto.deviceCode),
              },
            },
          });
          createdDevice = true;
        } catch (e) {
          if (this.isUniqueConstraint(e)) {
            device = await tx.device.findUnique({ where: { code: dto.deviceCode } });
            createdDevice = false;
          } else {
            throw e;
          }
          if (!device) {
            this.logger.error('device create race: could not re-load');
            throw e;
          }
        }
      }

      return {
        deviceId: device.id,
        deviceCategoryId: device.deviceCategoryId,
        created: { category: createdCategory, device: createdDevice },
      };
    });
  }
}
