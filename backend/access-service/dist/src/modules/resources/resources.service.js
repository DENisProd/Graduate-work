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
exports.ResourcesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
const exceptions_1 = require("../common/exceptions");
let ResourcesService = class ResourcesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createRootForHouse(houseId) {
        const path = `/${houseId}`;
        const resource = await this.prisma.resource.create({
            data: {
                houseId,
                type: client_1.ResourceType.HOUSE,
                path,
                depth: 0,
            },
        });
        return { id: resource.id };
    }
    async create(dto) {
        const parent = await this.prisma.resource.findUnique({
            where: { id: dto.parentId },
        });
        if (!parent) {
            throw new exceptions_1.ResourceNotFoundException('Ресурс', 'id', dto.parentId);
        }
        const created = await this.prisma.resource.create({
            data: {
                houseId: parent.houseId,
                type: dto.type,
                name: dto.name,
                externalId: dto.externalId,
                parentId: parent.id,
                path: parent.path,
                depth: parent.depth + 1,
            },
        });
        const path = `${parent.path}/${created.id}`;
        return this.prisma.resource.update({
            where: { id: created.id },
            data: { path },
        });
    }
    async findById(id) {
        const resource = await this.prisma.resource.findUnique({
            where: { id },
        });
        if (!resource) {
            throw new exceptions_1.ResourceNotFoundException('Ресурс', 'id', id);
        }
        return resource;
    }
    async update(id, data) {
        await this.findById(id);
        const updateData = {};
        if (data.name !== undefined)
            updateData.name = data.name;
        if (data.externalId !== undefined)
            updateData.externalId = data.externalId;
        return this.prisma.resource.update({
            where: { id },
            data: updateData,
        });
    }
    async delete(id) {
        await this.findById(id);
        await this.prisma.resource.delete({ where: { id } });
    }
    async findDeviceFunctionByExternalOrId(deviceFunctionId) {
        const byId = await this.prisma.resource.findFirst({
            where: { id: deviceFunctionId, type: client_1.ResourceType.DEVICE_FUNCTION },
        });
        if (byId)
            return byId;
        const byExternal = await this.prisma.resource.findFirst({
            where: { externalId: deviceFunctionId, type: client_1.ResourceType.DEVICE_FUNCTION },
        });
        if (byExternal)
            return byExternal;
        throw new exceptions_1.ResourceNotFoundException('Функция устройства', 'deviceFunctionId', deviceFunctionId);
    }
    async getTreeByHouseId(houseId) {
        const resources = await this.prisma.resource.findMany({
            where: { houseId },
            orderBy: { depth: 'asc' },
        });
        const nodes = new Map();
        const roots = [];
        for (const r of resources) {
            const node = {
                id: r.id,
                houseId: r.houseId,
                type: r.type,
                name: r.name ?? undefined,
                externalId: r.externalId ?? undefined,
                parentId: r.parentId ?? undefined,
                path: r.path,
                depth: r.depth,
                createdAt: r.createdAt.toISOString(),
                children: [],
            };
            nodes.set(r.id, node);
            if (!r.parentId) {
                roots.push(node);
            }
            else {
                const parent = nodes.get(r.parentId);
                if (parent) {
                    parent.children.push(node);
                }
                else {
                    roots.push(node);
                }
            }
        }
        return roots;
    }
};
exports.ResourcesService = ResourcesService;
exports.ResourcesService = ResourcesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ResourcesService);
