"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var IntegrationCatalogService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationCatalogService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
function titleFromCode(code) {
    return code
        .toLowerCase()
        .split(/_+/)
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}
let IntegrationCatalogService = IntegrationCatalogService_1 = class IntegrationCatalogService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(IntegrationCatalogService_1.name);
    }
    buildTranslationRows(bundle, code) {
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
    isUniqueConstraint(e) {
        return e instanceof client_1.Prisma.PrismaClientKnownRequestError && e.code === 'P2002';
    }
    async ensureCatalog(dto) {
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
                    }
                    catch (e) {
                        if (this.isUniqueConstraint(e)) {
                            deviceType = await tx.deviceType.findUnique({ where: { code: dto.deviceTypeCode } });
                        }
                        else {
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
                }
                catch (e) {
                    if (this.isUniqueConstraint(e)) {
                        category = await tx.deviceCategory.findUnique({ where: { code: dto.deviceCategoryCode } });
                        createdCategory = false;
                    }
                    else {
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
                }
                catch (e) {
                    if (this.isUniqueConstraint(e)) {
                        device = await tx.device.findUnique({ where: { code: dto.deviceCode } });
                        createdDevice = false;
                    }
                    else {
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
};
exports.IntegrationCatalogService = IntegrationCatalogService;
exports.IntegrationCatalogService = IntegrationCatalogService = IntegrationCatalogService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], IntegrationCatalogService);
