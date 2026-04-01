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
exports.HouseRoomsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const houses_service_1 = require("../houses/houses.service");
const exceptions_1 = require("../common/exceptions");
const client_1 = require("@prisma/client");
let HouseRoomsService = class HouseRoomsService {
    constructor(prisma, housesService) {
        this.prisma = prisma;
        this.housesService = housesService;
    }
    async findById(id) {
        const room = await this.prisma.resource.findUnique({
            where: { id },
            include: { house: true },
        });
        if (!room || room.type !== client_1.ResourceType.ROOM) {
            throw new exceptions_1.ResourceNotFoundException('Комната', 'id', id);
        }
        return room;
    }
    async findByHouseId(houseId) {
        await this.housesService.findById(houseId);
        const rooms = await this.prisma.resource.findMany({
            where: { houseId, type: client_1.ResourceType.ROOM },
            include: { house: true },
            orderBy: { createdAt: 'asc' },
        });
        return rooms;
    }
    async create(dto) {
        await this.housesService.findById(dto.houseId);
        let parentResource = await this.prisma.resource.findFirst({
            where: { houseId: dto.houseId, type: client_1.ResourceType.HOUSE },
        });
        if (!parentResource) {
            parentResource = await this.prisma.resource.create({
                data: {
                    houseId: dto.houseId,
                    type: client_1.ResourceType.HOUSE,
                    path: `/${dto.houseId}`,
                    depth: 0,
                },
            });
        }
        const room = await this.prisma.resource.create({
            data: {
                houseId: dto.houseId,
                type: client_1.ResourceType.ROOM,
                name: dto.name,
                parentId: parentResource.id,
                path: parentResource.path,
                depth: parentResource.depth + 1,
            },
        });
        await this.prisma.resource.update({
            where: { id: room.id },
            data: { path: `${parentResource.path}/${room.id}` },
        });
        return this.findById(room.id);
    }
    async update(id, dto) {
        await this.findById(id);
        await this.prisma.resource.update({
            where: { id },
            data: { name: dto.name },
        });
        return this.findById(id);
    }
    async delete(id) {
        await this.findById(id);
        await this.prisma.resource.delete({ where: { id } });
    }
    async existsInHouse(roomId, houseId) {
        const count = await this.prisma.resource.count({
            where: { id: roomId, houseId, type: client_1.ResourceType.ROOM },
        });
        return count > 0;
    }
};
exports.HouseRoomsService = HouseRoomsService;
exports.HouseRoomsService = HouseRoomsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        houses_service_1.HousesService])
], HouseRoomsService);
