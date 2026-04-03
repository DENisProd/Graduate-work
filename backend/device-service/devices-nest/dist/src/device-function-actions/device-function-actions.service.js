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
exports.DeviceFunctionActionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const page_response_dto_1 = require("../devices/dto/page-response.dto");
let DeviceFunctionActionsService = class DeviceFunctionActionsService {
    constructor(prisma) {
        this.prisma = prisma;
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
            deviceFunctionId: entity.deviceFunctionId,
            actionType: entity.actionType,
            payloadTemplate: entity.payloadTemplate,
            active: entity.active,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            translations,
        };
    }
    async findByFunctionId(functionId) {
        const items = await this.prisma.deviceFunctionAction.findMany({
            where: { active: true, deviceFunctionId: functionId },
            include: { translations: true },
            orderBy: { createdAt: 'desc' },
        });
        return items.map((a) => this.toResponse(a));
    }
    async findByFunctionIdPaged(functionId, page, size) {
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
        return new page_response_dto_1.PageResponse({
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
    async findByDeviceId(deviceId) {
        const items = await this.prisma.deviceFunctionAction.findMany({
            where: { active: true, deviceFunction: { deviceId } },
            include: { translations: true },
            orderBy: { createdAt: 'desc' },
        });
        return items.map((a) => this.toResponse(a));
    }
    async findByDeviceIdPaged(deviceId, page, size) {
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
        return new page_response_dto_1.PageResponse({
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
    async findById(id) {
        const entity = await this.prisma.deviceFunctionAction.findUnique({
            where: { id },
            include: { translations: true },
        });
        if (!entity) {
            throw new common_1.NotFoundException('Device function action not found');
        }
        return this.toResponse(entity);
    }
    async execute(id) {
        const entity = await this.prisma.deviceFunctionAction.findUnique({
            where: { id },
            include: { translations: true },
        });
        if (!entity) {
            throw new common_1.NotFoundException('Device function action not found');
        }
        return this.toResponse(entity);
    }
    async findByFunctionIdFull(functionId, page, size) {
        if (page !== undefined && size !== undefined) {
            return this.findByFunctionIdPaged(functionId, page, size);
        }
        return this.findByFunctionId(functionId);
    }
    async findByDeviceIdFull(deviceId, page, size) {
        if (page !== undefined && size !== undefined) {
            return this.findByDeviceIdPaged(deviceId, page, size);
        }
        return this.findByDeviceId(deviceId);
    }
    async findByIdFull(id) {
        return this.findById(id);
    }
    async create(request) {
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
    async update(id, request) {
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
    async delete(id) {
        await this.prisma.deviceFunctionAction.update({
            where: { id },
            data: { active: false },
        });
    }
    async ensureExists(id) {
        const exists = await this.prisma.deviceFunctionAction.findUnique({ where: { id } });
        if (!exists) {
            throw new common_1.NotFoundException('Device function action not found');
        }
    }
};
exports.DeviceFunctionActionsService = DeviceFunctionActionsService;
exports.DeviceFunctionActionsService = DeviceFunctionActionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DeviceFunctionActionsService);
