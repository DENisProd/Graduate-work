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
exports.DeviceFunctionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const page_response_dto_1 = require("../devices/dto/page-response.dto");
let DeviceFunctionsService = class DeviceFunctionsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    toResponse(entity) {
        const translations = entity.translations?.reduce((acc, t) => {
            acc[t.locale] = { name: t.name, description: t.description };
            return acc;
        }, {}) ?? null;
        const actions = entity.actions
            ? entity.actions.map((a) => ({
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
                translations: a.translations?.reduce((acc2, t) => {
                    acc2[t.locale] = { name: t.name, description: t.description };
                    return acc2;
                }, {}) ?? null,
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
    async findByDeviceId(deviceId) {
        const items = await this.prisma.deviceFunction.findMany({
            where: { active: true, deviceId },
            include: { translations: true, actions: { include: { translations: true } } },
            orderBy: { createdAt: 'desc' },
        });
        return items.map((f) => this.toResponse(f));
    }
    async findByDeviceIdPaged(deviceId, page, size) {
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
        return new page_response_dto_1.PageResponse({
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
    async findWritableFunctions(deviceId) {
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
    async findById(id) {
        const entity = await this.prisma.deviceFunction.findUnique({
            where: { id },
            include: { translations: true, actions: { include: { translations: true } } },
        });
        if (!entity) {
            throw new common_1.NotFoundException('Device function not found');
        }
        return this.toResponse(entity);
    }
    async findByIdDetailed(id) {
        const entity = await this.prisma.deviceFunction.findUnique({
            where: { id },
            include: { translations: true, actions: { include: { translations: true } } },
        });
        if (!entity) {
            throw new common_1.NotFoundException('Device function not found');
        }
        return this.toResponse(entity);
    }
    async updateValue(id, value) {
        const updated = await this.prisma.deviceFunction.update({
            where: { id },
            data: { currentValue: value },
            include: { translations: true, actions: { include: { translations: true } } },
        });
        return this.toResponse(updated);
    }
    async findByDeviceIdFull(deviceId) {
        return this.findByDeviceId(deviceId);
    }
    async findByDeviceIdFullPaged(deviceId, page, size) {
        return this.findByDeviceIdPaged(deviceId, page, size);
    }
    async findByIdFull(id) {
        return this.findByIdDetailed(id);
    }
    async create(request) {
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
    async update(id, request) {
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
    async delete(id) {
        await this.prisma.deviceFunction.update({
            where: { id },
            data: { active: false },
        });
    }
    async ensureExists(id) {
        const exists = await this.prisma.deviceFunction.findUnique({ where: { id } });
        if (!exists) {
            throw new common_1.NotFoundException('Device function not found');
        }
    }
};
exports.DeviceFunctionsService = DeviceFunctionsService;
exports.DeviceFunctionsService = DeviceFunctionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DeviceFunctionsService);
