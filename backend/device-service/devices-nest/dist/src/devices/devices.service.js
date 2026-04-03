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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevicesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const device_status_enum_1 = require("./device-status.enum");
const page_response_dto_1 = require("./dto/page-response.dto");
let DevicesService = class DevicesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    toDeviceResponse(entity) {
        const translationsMap = entity.translations?.reduce((acc, t) => {
            acc[t.locale] = { name: t.name, description: t.description };
            return acc;
        }, {}) ?? null;
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
                    createdAt: entity.deviceCategory.createdAt,
                    updatedAt: entity.deviceCategory.updatedAt,
                    translations: entity.deviceCategory.translations?.reduce((acc, t) => {
                        acc[t.locale] = { name: t.name, description: t.description };
                        return acc;
                    }, {}) ?? null,
                }
                : null,
            status: entity.status,
            online: entity.status === device_status_enum_1.DeviceStatus.ONLINE,
            serialNumber: entity.serialNumber,
            firmwareVersion: entity.firmwareVersion,
            active: entity.active,
            lastSeenAt: entity.lastSeenAt,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            functions: null,
            translations: translationsMap,
        };
    }
    async findAll(page, size) {
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
        return new page_response_dto_1.PageResponse({
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
    async findByCategoryId(categoryId, page, size) {
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
        return new page_response_dto_1.PageResponse({
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
    async findById(id) {
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
            throw new common_1.NotFoundException('Device not found');
        }
        return this.toDeviceResponse(device);
    }
    async findByIdDetailed(id) {
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
            throw new common_1.NotFoundException('Device not found');
        }
        return this.toDeviceResponse(device);
    }
    async findByCode(code) {
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
            throw new common_1.NotFoundException('Device not found');
        }
        return this.toDeviceResponse(device);
    }
    async create(request) {
        const created = await this.prisma.device.create({
            data: {
                code: request.code,
                deviceCategory: { connect: { id: request.deviceCategoryId } },
                status: request.status ?? device_status_enum_1.DeviceStatus.OFFLINE,
                serialNumber: request.serialNumber,
                firmwareVersion: request.firmwareVersion,
                active: request.active ?? true,
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
    async update(id, request) {
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
    async updateStatus(id, status) {
        await this.ensureExists(id);
        const updated = await this.prisma.device.update({
            where: { id },
            data: {
                status,
                lastSeenAt: status === device_status_enum_1.DeviceStatus.ONLINE ? new Date() : undefined,
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
    async delete(id) {
        await this.prisma.device.update({
            where: { id },
            data: { active: false },
        });
    }
    async ensureExists(id) {
        const exists = await this.prisma.device.findUnique({ where: { id } });
        if (!exists) {
            throw new common_1.NotFoundException('Device not found');
        }
    }
};
exports.DevicesService = DevicesService;
exports.DevicesService = DevicesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DevicesService);
