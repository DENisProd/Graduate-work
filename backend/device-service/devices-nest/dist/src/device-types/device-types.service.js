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
exports.DeviceTypesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DeviceTypesService = class DeviceTypesService {
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
            active: entity.active,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            translations,
        };
    }
    async findAll() {
        const types = await this.prisma.deviceType.findMany({
            where: { active: true },
            include: { translations: true },
            orderBy: { createdAt: 'desc' },
        });
        return types.map((t) => this.toResponse(t));
    }
    async findById(id) {
        const type = await this.prisma.deviceType.findUnique({
            where: { id },
            include: { translations: true },
        });
        if (!type) {
            throw new common_1.NotFoundException('Device type not found');
        }
        return this.toResponse(type);
    }
    async findByCode(code) {
        const type = await this.prisma.deviceType.findUnique({
            where: { code },
            include: { translations: true },
        });
        if (!type) {
            throw new common_1.NotFoundException('Device type not found');
        }
        return this.toResponse(type);
    }
    async findAllFull() {
        return this.findAll();
    }
    async findByIdFull(id) {
        return this.findById(id);
    }
    async findByCodeFull(code) {
        return this.findByCode(code);
    }
    async create(request) {
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
    async update(id, request) {
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
    async delete(id) {
        await this.prisma.deviceType.update({
            where: { id },
            data: { active: false },
        });
    }
    async ensureExists(id) {
        const exists = await this.prisma.deviceType.findUnique({ where: { id } });
        if (!exists) {
            throw new common_1.NotFoundException('Device type not found');
        }
    }
};
exports.DeviceTypesService = DeviceTypesService;
exports.DeviceTypesService = DeviceTypesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DeviceTypesService);
