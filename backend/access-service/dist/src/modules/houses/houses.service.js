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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HousesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const users_service_1 = require("../../users/users.service");
const exceptions_1 = require("../common/exceptions");
const house_roles_service_1 = require("../house-roles/house-roles.service");
let HousesService = class HousesService {
    constructor(prisma, userService, houseRolesService) {
        this.prisma = prisma;
        this.userService = userService;
        this.houseRolesService = houseRolesService;
    }
    async findById(id) {
        const house = await this.prisma.house.findUnique({
            where: { id },
            include: { owner: true },
        });
        if (!house) {
            throw new exceptions_1.ResourceNotFoundException('Дом', 'id', id);
        }
        return house;
    }
    async findByOwnerId(ownerId, page, size, sort) {
        const [sortField, sortDir] = sort.includes(',') ? sort.split(',') : ['createdAt', 'desc'];
        const orderBy = { [sortField.trim()]: sortDir?.toLowerCase() === 'asc' ? 'asc' : 'desc' };
        const where = {
            OR: [
                { owner: { externalUserId: ownerId } },
                { members: { some: { user: { externalUserId: ownerId } } } },
            ],
        };
        const [content, total] = await Promise.all([
            this.prisma.house.findMany({
                where,
                include: { owner: true },
                skip: page * size,
                take: size,
                orderBy,
            }),
            this.prisma.house.count({ where }),
        ]);
        return { content: content, total };
    }
    async findAll(page, size, sort) {
        const [sortField, sortDir] = sort.includes(',') ? sort.split(',') : ['createdAt', 'desc'];
        const orderBy = { [sortField.trim()]: sortDir?.toLowerCase() === 'asc' ? 'asc' : 'desc' };
        const [content, total] = await Promise.all([
            this.prisma.house.findMany({
                include: { owner: true },
                skip: page * size,
                take: size,
                orderBy,
            }),
            this.prisma.house.count(),
        ]);
        return { content: content, total };
    }
    async create(dto) {
        const owner = await this.userService.findOrCreateByUserId(dto.ownerId);
        const house = await this.prisma.house.create({
            data: {
                name: dto.name,
                ownerId: owner.id,
                avatarUrl: dto.avatarUrl,
                address: dto.address,
            },
        });
        const ownerMember = await this.prisma.houseMember.create({
            data: {
                userId: owner.id,
                houseId: house.id,
            },
        });
        await this.houseRolesService.createDefaultRolesForHouse(house.id, ownerMember.id);
        return this.findById(house.id);
    }
    async update(id, dto) {
        await this.findById(id);
        await this.prisma.house.update({
            where: { id },
            data: {
                name: dto.name ?? undefined,
                avatarUrl: dto.avatarUrl ?? undefined,
                address: dto.address ?? undefined,
                updatedAt: new Date(),
            },
        });
        return this.findById(id);
    }
    async delete(id) {
        await this.findById(id);
        await this.prisma.house.delete({ where: { id } });
    }
    async isOwner(houseId, userId) {
        const count = await this.prisma.house.count({
            where: { id: houseId, owner: { externalUserId: userId } },
        });
        return count > 0;
    }
};
exports.HousesService = HousesService;
exports.HousesService = HousesService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => house_roles_service_1.HouseRolesService))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        users_service_1.UserService,
        house_roles_service_1.HouseRolesService])
], HousesService);
