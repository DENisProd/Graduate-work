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
exports.AccessControlService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const houses_service_1 = require("../houses/houses.service");
const house_members_service_1 = require("../house-members/house-members.service");
const users_service_1 = require("../../users/users.service");
const house_roles_service_1 = require("../house-roles/house-roles.service");
const exceptions_1 = require("../common/exceptions");
const client_1 = require("@prisma/client");
const INCLUDE = {
    resource: { include: { house: true } },
    houseMember: { include: { user: true } },
    role: true,
    grantedBy: true,
};
let AccessControlService = class AccessControlService {
    constructor(prisma, housesService, houseMembersService, userService, houseRolesService) {
        this.prisma = prisma;
        this.housesService = housesService;
        this.houseMembersService = houseMembersService;
        this.userService = userService;
        this.houseRolesService = houseRolesService;
    }
    async createRight(dto, grantedByUserId) {
        const resource = await this.prisma.resource.findUnique({
            where: { id: dto.resourceId },
            include: { house: true },
        });
        if (!resource)
            throw new exceptions_1.ResourceNotFoundException('Ресурс', 'id', dto.resourceId);
        const houseId = resource.houseId;
        const hasMemberTarget = dto.houseMemberId != null;
        const hasRoleTarget = dto.houseRoleId != null;
        if (!hasMemberTarget && !hasRoleTarget) {
            throw new exceptions_1.BadRequestException('Нужно указать либо houseMemberId, либо houseRoleId');
        }
        if (hasMemberTarget && hasRoleTarget) {
            throw new exceptions_1.BadRequestException('Нельзя одновременно указывать houseMemberId и houseRoleId');
        }
        let memberId;
        let roleId;
        if (hasMemberTarget) {
            const member = await this.houseMembersService.findById(dto.houseMemberId);
            if (member.houseId !== houseId) {
                throw new exceptions_1.BadRequestException(`Участник с ID ${dto.houseMemberId} не принадлежит дому ${houseId}`);
            }
            memberId = member.id;
        }
        else if (hasRoleTarget) {
            const role = await this.prisma.houseRole.findUnique({ where: { id: dto.houseRoleId } });
            if (!role)
                throw new exceptions_1.ResourceNotFoundException('Роль дома', 'id', dto.houseRoleId);
            if (role.houseId !== houseId) {
                throw new exceptions_1.BadRequestException(`Роль с ID ${dto.houseRoleId} не принадлежит дому ${houseId}`);
            }
            roleId = role.id;
        }
        if (hasMemberTarget && memberId != null) {
            const canEdit = await this.houseRolesService.canEditMemberRights(houseId, grantedByUserId, memberId);
            if (!canEdit)
                throw new exceptions_1.ForbiddenException('Недостаточно прав для выдачи доступа этому участнику');
        }
        else if (hasRoleTarget && roleId != null) {
            const canEdit = await this.houseRolesService.canEditRoleRights(houseId, grantedByUserId, roleId);
            if (!canEdit)
                throw new exceptions_1.ForbiddenException('Недостаточно прав для выдачи доступа этой роли');
        }
        const grantedBy = await this.userService.findOrCreateByUserId(grantedByUserId);
        return this.prisma.accessRight.create({
            data: {
                resourceId: dto.resourceId,
                houseMemberId: memberId,
                roleId,
                accessRightType: dto.accessRightType,
                parameters: dto.parameters ?? undefined,
                expiresAt: dto.expiresAt ?? undefined,
                grantedById: grantedBy.id,
            },
            include: INCLUDE,
        });
    }
    async updateRight(id, dto, userId) {
        const right = await this.prisma.accessRight.findUnique({
            where: { id },
            include: INCLUDE,
        });
        if (!right)
            throw new exceptions_1.ResourceNotFoundException('Право доступа', 'id', id);
        const houseId = right.resource.houseId;
        const canEdit = right.houseMemberId != null
            ? await this.houseRolesService.canEditMemberRights(houseId, userId, right.houseMemberId)
            : right.roleId != null
                ? await this.houseRolesService.canEditRoleRights(houseId, userId, right.roleId)
                : false;
        if (!canEdit)
            throw new exceptions_1.ForbiddenException('Недостаточно прав для обновления этого права доступа');
        const hasMemberTarget = dto.houseMemberId != null;
        const hasRoleTarget = dto.houseRoleId != null;
        if (hasMemberTarget && hasRoleTarget) {
            throw new exceptions_1.BadRequestException('Нельзя одновременно указывать houseMemberId и houseRoleId');
        }
        let targetUpdate = {};
        if (hasMemberTarget) {
            const member = await this.houseMembersService.findById(dto.houseMemberId);
            if (member.houseId !== houseId)
                throw new exceptions_1.BadRequestException('Участник не принадлежит дому');
            targetUpdate = { houseMemberId: member.id, roleId: null };
        }
        else if (hasRoleTarget) {
            const role = await this.prisma.houseRole.findUnique({ where: { id: dto.houseRoleId } });
            if (!role)
                throw new exceptions_1.ResourceNotFoundException('Роль дома', 'id', dto.houseRoleId);
            if (role.houseId !== houseId)
                throw new exceptions_1.BadRequestException('Роль не принадлежит дому');
            targetUpdate = { houseMemberId: null, roleId: role.id };
        }
        return this.prisma.accessRight.update({
            where: { id },
            data: {
                accessRightType: dto.accessRightType,
                parameters: dto.parameters ?? undefined,
                expiresAt: dto.expiresAt ?? undefined,
                ...targetUpdate,
            },
            include: INCLUDE,
        });
    }
    async deleteRight(id, userId) {
        const right = await this.prisma.accessRight.findUnique({
            where: { id },
            include: { resource: { include: { house: true } } },
        });
        if (!right)
            throw new exceptions_1.ResourceNotFoundException('Право доступа', 'id', id);
        const houseId = right.resource.houseId;
        const canEdit = right.houseMemberId != null
            ? await this.houseRolesService.canEditMemberRights(houseId, userId, right.houseMemberId)
            : right.roleId != null
                ? await this.houseRolesService.canEditRoleRights(houseId, userId, right.roleId)
                : false;
        if (!canEdit)
            throw new exceptions_1.ForbiddenException('Недостаточно прав для удаления этого права доступа');
        await this.prisma.accessRight.delete({ where: { id } });
    }
    async findRightsByMemberId(memberId, page, size, sort) {
        const member = await this.houseMembersService.findById(memberId);
        const roleIds = member.roles.map((r) => r.roleId);
        const [sortField, sortDir] = sort.includes(',') ? sort.split(',') : ['createdAt', 'desc'];
        const orderBy = { [sortField.trim()]: sortDir?.toLowerCase() === 'asc' ? 'asc' : 'desc' };
        const targetCondition = roleIds.length > 0
            ? { OR: [{ houseMemberId: memberId }, { roleId: { in: roleIds } }] }
            : { houseMemberId: memberId };
        const [content, total] = await Promise.all([
            this.prisma.accessRight.findMany({
                where: targetCondition,
                include: INCLUDE,
                skip: page * size,
                take: size,
                orderBy,
            }),
            this.prisma.accessRight.count({ where: targetCondition }),
        ]);
        return { content: content, total };
    }
    async findRightsByHouseId(houseId, page, size, sort) {
        const now = new Date();
        await this.housesService.findById(houseId);
        const [sortField, sortDir] = sort.includes(',') ? sort.split(',') : ['createdAt', 'desc'];
        const orderBy = { [sortField.trim()]: sortDir?.toLowerCase() === 'asc' ? 'asc' : 'desc' };
        const where = {
            resource: { houseId },
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        };
        const [content, total] = await Promise.all([
            this.prisma.accessRight.findMany({
                where,
                include: INCLUDE,
                skip: page * size,
                take: size,
                orderBy,
            }),
            this.prisma.accessRight.count({ where }),
        ]);
        return { content: content, total };
    }
    async checkAccess(dto) {
        const resource = await this.prisma.resource.findUnique({ where: { id: dto.resourceId } });
        if (!resource)
            throw new exceptions_1.ResourceNotFoundException('Ресурс', 'id', dto.resourceId);
        const member = await this.houseMembersService.findByUserIdAndHouseId(dto.userId, resource.houseId);
        const roleIds = member.roles.map((r) => r.roleId);
        const now = new Date();
        const applicable = [];
        const seen = new Set();
        const list = await this.prisma.accessRight.findMany({
            where: {
                AND: [
                    {
                        resourceId: dto.resourceId,
                        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
                    },
                    roleIds.length > 0
                        ? { OR: [{ houseMemberId: member.id }, { roleId: { in: roleIds } }] }
                        : { houseMemberId: member.id },
                ],
            },
            include: INCLUDE,
        });
        list.forEach((r) => {
            if (!seen.has(r.id)) {
                seen.add(r.id);
                applicable.push(r);
            }
        });
        if (applicable.length === 0) {
            return {
                hasAccess: false,
                effectiveRightType: undefined,
                applicableRights: [],
                reason: 'Нет настроенных прав доступа',
            };
        }
        const isExpired = (r) => r.expiresAt != null && r.expiresAt <= now;
        applicable.sort((a, b) => {
            const aDeny = a.accessRightType === client_1.AccessRightType.DENY ? 0 : 1;
            const bDeny = b.accessRightType === client_1.AccessRightType.DENY ? 0 : 1;
            return aDeny - bDeny;
        });
        for (const r of applicable) {
            if (r.accessRightType === client_1.AccessRightType.DENY) {
                return {
                    hasAccess: false,
                    effectiveRightType: 'DENY',
                    applicableRights: applicable.map((x) => toDetail(x, isExpired(x))),
                    reason: 'Доступ запрещен правилом DENY',
                };
            }
        }
        const operation = dto.operationType?.toLowerCase();
        const isRead = operation === 'read';
        const isWrite = operation === 'write';
        if (operation != null) {
            for (const r of applicable) {
                if (r.accessRightType === client_1.AccessRightType.READ && !isRead) {
                    return {
                        hasAccess: false,
                        effectiveRightType: 'READ',
                        applicableRights: applicable.map((x) => toDetail(x, isExpired(x))),
                        reason: `Право READ не позволяет операцию ${operation}`,
                    };
                }
                if (r.accessRightType === client_1.AccessRightType.WRITE && !isWrite) {
                    return {
                        hasAccess: false,
                        effectiveRightType: 'WRITE',
                        applicableRights: applicable.map((x) => toDetail(x, isExpired(x))),
                        reason: `Право WRITE не позволяет операцию ${operation}`,
                    };
                }
            }
        }
        const effective = applicable[0];
        const effectiveType = effective.accessRightType;
        const hasAccess = effectiveType === client_1.AccessRightType.ALLOW ||
            effectiveType === client_1.AccessRightType.READ ||
            effectiveType === client_1.AccessRightType.WRITE;
        return {
            hasAccess,
            effectiveRightType: effectiveType,
            applicableRights: applicable.map((x) => toDetail(x, isExpired(x))),
            reason: hasAccess ? 'Доступ разрешен' : 'Доступ запрещен',
        };
    }
    async cleanupExpiredRights() {
        const now = new Date();
        await this.prisma.accessRight.deleteMany({
            where: { expiresAt: { not: null, lte: now } },
        });
    }
};
exports.AccessControlService = AccessControlService;
exports.AccessControlService = AccessControlService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        houses_service_1.HousesService,
        house_members_service_1.HouseMembersService,
        users_service_1.UserService,
        house_roles_service_1.HouseRolesService])
], AccessControlService);
function toDetail(r, expired) {
    return {
        rightId: r.id,
        type: r.accessRightType,
        deviceId: r.resource.type === client_1.ResourceType.DEVICE ? r.resource.externalId ?? undefined : undefined,
        deviceFunctionId: r.resource.type === client_1.ResourceType.DEVICE_FUNCTION ? r.resource.externalId ?? undefined : undefined,
        houseRoomId: r.resource.type === client_1.ResourceType.ROOM ? r.resource.id : undefined,
        isExpired: expired,
    };
}
