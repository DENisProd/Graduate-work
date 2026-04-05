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
exports.DeviceCategoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const page_response_dto_1 = require("../devices/dto/page-response.dto");
let DeviceCategoriesService = class DeviceCategoriesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    toDeviceType(entity) {
        if (!entity) {
            return null;
        }
        const translations = entity.translations?.reduce((acc, t) => {
            acc[t.locale] = { name: t.name, description: t.description };
            return acc;
        }, {}) ?? null;
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
    toResponse(entity) {
        const translations = entity.translations?.reduce((acc, t) => {
            acc[t.locale] = { name: t.name, description: t.description };
            return acc;
        }, {}) ?? null;
        return {
            id: entity.id,
            code: entity.code,
            name: entity.translations?.[0]?.name ?? '',
            description: entity.translations?.[0]?.description ?? null,
            deviceType: this.toDeviceType(entity.deviceType),
            active: entity.active,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            translations,
        };
    }
    async findAll(page, size) {
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
        return new page_response_dto_1.PageResponse({
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
    async findAllList() {
        const items = await this.prisma.deviceCategory.findMany({
            where: { active: true },
            include: { translations: true, deviceType: { include: { translations: true } } },
            orderBy: { createdAt: 'desc' },
        });
        return items.map((c) => this.toResponse(c));
    }
    async findByDeviceTypeId(deviceTypeId) {
        const items = await this.prisma.deviceCategory.findMany({
            where: { active: true, deviceTypeId },
            include: { translations: true, deviceType: { include: { translations: true } } },
            orderBy: { createdAt: 'desc' },
        });
        return items.map((c) => this.toResponse(c));
    }
    async findById(id) {
        const entity = await this.prisma.deviceCategory.findUnique({
            where: { id },
            include: { translations: true, deviceType: { include: { translations: true } } },
        });
        if (!entity) {
            throw new common_1.NotFoundException('Device category not found');
        }
        return this.toResponse(entity);
    }
    async findByCode(code) {
        const entity = await this.prisma.deviceCategory.findUnique({
            where: { code },
            include: { translations: true, deviceType: { include: { translations: true } } },
        });
        if (!entity) {
            throw new common_1.NotFoundException('Device category not found');
        }
        return this.toResponse(entity);
    }
    async findByDeviceTypeIdFull(deviceTypeId) {
        return this.findByDeviceTypeId(deviceTypeId);
    }
    async findAllFull(page, size) {
        if (page !== undefined && size !== undefined) {
            return this.findAll(page, size);
        }
        return this.findAllList();
    }
    async findByIdFull(id) {
        return this.findById(id);
    }
    async findByCodeFull(code) {
        return this.findByCode(code);
    }
    async create(request) {
        const created = await this.prisma.deviceCategory.create({
            data: {
                code: request.code,
                deviceType: { connect: { id: request.deviceTypeId } },
                active: request.active ?? true,
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
    async update(id, request) {
        await this.ensureExists(id);
        const updated = await this.prisma.deviceCategory.update({
            where: { id },
            data: {
                code: request.code,
                deviceType: { connect: { id: request.deviceTypeId } },
                active: request.active ?? undefined,
            },
            include: { translations: true, deviceType: { include: { translations: true } } },
        });
        return this.toResponse(updated);
    }
    async delete(id) {
        await this.prisma.deviceCategory.update({
            where: { id },
            data: { active: false },
        });
    }
    async ensureExists(id) {
        const exists = await this.prisma.deviceCategory.findUnique({ where: { id } });
        if (!exists) {
            throw new common_1.NotFoundException('Device category not found');
        }
    }
};
exports.DeviceCategoriesService = DeviceCategoriesService;
exports.DeviceCategoriesService = DeviceCategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DeviceCategoriesService);
