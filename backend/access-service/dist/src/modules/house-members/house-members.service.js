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
exports.HouseMembersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const users_service_1 = require("../../users/users.service");
const houses_service_1 = require("../houses/houses.service");
const exceptions_1 = require("../common/exceptions");
const house_roles_service_1 = require("../house-roles/house-roles.service");
const MEMBER_WITH_ROLES_INCLUDE = {
    user: true,
    house: true,
    roles: { include: { role: { include: { permissions: true } } } },
};
let HouseMembersService = class HouseMembersService {
    constructor(prisma, userService, housesService, houseRolesService) {
        this.prisma = prisma;
        this.userService = userService;
        this.housesService = housesService;
        this.houseRolesService = houseRolesService;
    }
    async findById(id) {
        const member = await this.prisma.houseMember.findUnique({
            where: { id },
            include: MEMBER_WITH_ROLES_INCLUDE,
        });
        if (!member) {
            throw new exceptions_1.ResourceNotFoundException('Участник дома', 'id', id);
        }
        return member;
    }
    async findByIdWithAccessDetails(id) {
        const now = new Date();
        const [member, effective, directRights] = await Promise.all([
            this.prisma.houseMember.findUnique({
                where: { id },
                include: MEMBER_WITH_ROLES_INCLUDE,
            }),
            this.prisma.effectivePermission.findMany({
                where: {
                    houseMemberId: id,
                    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
                },
                include: { resource: true },
                orderBy: { resource: { path: 'asc' } },
            }),
            this.prisma.accessRight.findMany({
                where: {
                    houseMemberId: id,
                    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
                },
                include: {
                    resource: { include: { house: true } },
                    houseMember: { include: { user: true } },
                    role: true,
                    grantedBy: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
        ]);
        if (!member) {
            throw new exceptions_1.ResourceNotFoundException('Участник дома', 'id', id);
        }
        return {
            member: member,
            effective,
            directRights: directRights,
        };
    }
    async findByUserIdAndHouseId(userId, houseId) {
        const user = await this.userService.findByUserId(userId);
        const member = await this.prisma.houseMember.findFirst({
            where: { userId: user.id, houseId, removedAt: null },
            include: MEMBER_WITH_ROLES_INCLUDE,
        });
        if (!member) {
            throw new exceptions_1.ResourceNotFoundException('Участник дома', 'userId и houseId', `${userId}, ${houseId}`);
        }
        return member;
    }
    async isMember(userId, houseId) {
        const user = await this.prisma.user.findFirst({ where: { externalUserId: userId } });
        if (!user)
            return false;
        const count = await this.prisma.houseMember.count({
            where: { userId: user.id, houseId, removedAt: null },
        });
        return count > 0;
    }
    async findByHouseId(houseId, page, size, sort) {
        await this.housesService.findById(houseId);
        const [sortField, sortDir] = sort.includes(',') ? sort.split(',') : ['joinedAt', 'desc'];
        const orderBy = { [sortField.trim()]: sortDir?.toLowerCase() === 'asc' ? 'asc' : 'desc' };
        const [content, total] = await Promise.all([
            this.prisma.houseMember.findMany({
                where: { houseId, removedAt: null },
                include: MEMBER_WITH_ROLES_INCLUDE,
                skip: page * size,
                take: size,
                orderBy,
            }),
            this.prisma.houseMember.count({ where: { houseId, removedAt: null } }),
        ]);
        return { content: content, total };
    }
    async addMember(houseId, userId) {
        return this.addMemberFromInvitation(houseId, userId, {});
    }
    async addMemberFromInvitation(houseId, userId, invite) {
        await this.housesService.findById(houseId);
        const user = await this.userService.findOrCreateByUserId(userId);
        const existing = await this.prisma.houseMember.findFirst({
            where: { userId: user.id, houseId, removedAt: null },
        });
        if (existing) {
            throw new exceptions_1.DuplicateResourceException('Участник дома', 'userId и houseId', `${userId}, ${houseId}`);
        }
        const member = await this.prisma.houseMember.create({
            data: { userId: user.id, houseId },
        });
        const perms = invite.invitedPermissions ?? [];
        if (invite.roleId) {
            await this.prisma.houseMemberRole.create({
                data: { houseMemberId: member.id, roleId: invite.roleId },
            });
        }
        else if (perms.length > 0) {
            const priority = await this.houseRolesService.getNextAvailablePriority(houseId);
            const role = await this.prisma.houseRole.create({
                data: {
                    houseId,
                    name: `Приглашение ${member.id.slice(0, 8)}`,
                    priority,
                    isSystem: false,
                    permissions: {
                        create: [...new Set(perms)].map((permission) => ({ permission })),
                    },
                },
            });
            await this.prisma.houseMemberRole.create({
                data: { houseMemberId: member.id, roleId: role.id },
            });
        }
        else {
            const defaultRole = await this.houseRolesService.getDefaultRoleForHouse(houseId);
            await this.prisma.houseMemberRole.create({
                data: { houseMemberId: member.id, roleId: defaultRole.id },
            });
        }
        return this.findById(member.id);
    }
    async removeMember(houseId, userId) {
        await this.housesService.findById(houseId);
        const user = await this.userService.findByUserId(userId);
        const member = await this.prisma.houseMember.findFirst({
            where: { userId: user.id, houseId, removedAt: null },
            select: { id: true },
        });
        if (!member) {
            return;
        }
        const id = member.id;
        await this.prisma.$transaction(async (tx) => {
            await tx.houseMemberRole.deleteMany({ where: { houseMemberId: id } });
            await tx.effectivePermission.deleteMany({ where: { houseMemberId: id } });
            await tx.accessRight.deleteMany({ where: { houseMemberId: id } });
            await tx.houseMember.delete({ where: { id } });
        });
    }
    async findHousesByUserId(userId, page, size, sort) {
        const [sortField, sortDir] = sort.includes(',') ? sort.split(',') : ['createdAt', 'desc'];
        const orderBy = { [sortField.trim()]: sortDir?.toLowerCase() === 'asc' ? 'asc' : 'desc' };
        const where = { members: { some: { user: { externalUserId: userId }, removedAt: null } } };
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
        return { content, total };
    }
};
exports.HouseMembersService = HouseMembersService;
exports.HouseMembersService = HouseMembersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        users_service_1.UserService,
        houses_service_1.HousesService,
        house_roles_service_1.HouseRolesService])
], HouseMembersService);
