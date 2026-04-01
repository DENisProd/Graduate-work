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
exports.PermissionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
const resources_service_1 = require("../resources/resources.service");
const users_service_1 = require("../users/users.service");
const exceptions_1 = require("../common/exceptions");
const audit_service_1 = require("../audit/audit.service");
const house_roles_service_1 = require("../house-roles/house-roles.service");
const house_members_service_1 = require("../house-members/house-members.service");
let PermissionsService = class PermissionsService {
    constructor(prisma, resourcesService, membersService, rolesService, usersService, auditService) {
        this.prisma = prisma;
        this.resourcesService = resourcesService;
        this.membersService = membersService;
        this.rolesService = rolesService;
        this.usersService = usersService;
        this.auditService = auditService;
        this.accessRightWithResourceInclude = {
            resource: {
                select: {
                    type: true,
                    depth: true,
                },
            },
        };
    }
    async create(dto, grantedByExternalUserId) {
        const resource = await this.resourcesService.findById(dto.resourceId);
        const hasMember = !!dto.houseMemberId;
        const hasRole = !!dto.roleId;
        if (!hasMember && !hasRole) {
            throw new exceptions_1.BadRequestException('Нужно указать либо houseMemberId, либо roleId');
        }
        if (hasMember && hasRole) {
            throw new exceptions_1.BadRequestException('Нельзя одновременно указывать houseMemberId и roleId');
        }
        let houseMemberId;
        let roleId;
        if (dto.houseMemberId) {
            const member = await this.membersService.findById(dto.houseMemberId);
            if (member.houseId !== resource.houseId) {
                throw new exceptions_1.BadRequestException('Участник не принадлежит дому ресурса');
            }
            houseMemberId = member.id;
        }
        if (dto.roleId) {
            const role = await this.rolesService.findById(dto.roleId);
            if (role.houseId !== resource.houseId) {
                throw new exceptions_1.BadRequestException('Роль не принадлежит дому ресурса');
            }
            roleId = role.id;
        }
        const grantedBy = await this.usersService.findOrCreateByExternalUserId(grantedByExternalUserId);
        const right = await this.prisma.accessRight.create({
            data: {
                resourceId: resource.id,
                houseMemberId,
                roleId,
                accessRightType: dto.accessRightType,
                expiresAt: dto.expiresAt ?? null,
                grantedById: grantedBy.id,
            },
        });
        if (houseMemberId) {
            await this.prisma.effectivePermission.upsert({
                where: {
                    houseMemberId_resourceId_accessRightType: {
                        houseMemberId,
                        resourceId: resource.id,
                        accessRightType: dto.accessRightType,
                    },
                },
                create: {
                    houseMemberId,
                    resourceId: resource.id,
                    accessRightType: dto.accessRightType,
                    sourceType: client_1.PermissionSourceType.DIRECT,
                    sourceId: right.id,
                    expiresAt: dto.expiresAt ?? null,
                },
                update: {
                    sourceType: client_1.PermissionSourceType.DIRECT,
                    sourceId: right.id,
                    expiresAt: dto.expiresAt ?? null,
                },
            });
        }
        await this.auditService.log(grantedByExternalUserId, audit_service_1.AUDIT_ACTIONS.ACCESS_GRANTED, right.id, {
            resourceId: resource.id,
            houseMemberId: houseMemberId ?? undefined,
            roleId: roleId ?? undefined,
        });
        return right;
    }
    async findById(id) {
        const right = await this.prisma.accessRight.findUnique({ where: { id } });
        if (!right) {
            throw new exceptions_1.ResourceNotFoundException('Право доступа', 'id', id);
        }
        return right;
    }
    async delete(id) {
        const right = await this.findById(id);
        if (right.houseMemberId) {
            await this.prisma.effectivePermission.deleteMany({
                where: {
                    houseMemberId: right.houseMemberId,
                    resourceId: right.resourceId,
                    accessRightType: right.accessRightType,
                    sourceType: client_1.PermissionSourceType.DIRECT,
                    sourceId: right.id,
                },
            });
        }
        await this.prisma.accessRight.delete({ where: { id } });
    }
    async findByResourceId(resourceId) {
        await this.resourcesService.findById(resourceId);
        return this.prisma.accessRight.findMany({
            where: {
                resourceId,
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
            include: this.accessRightWithResourceInclude,
            orderBy: { createdAt: 'desc' },
        });
    }
    async findByUserId(externalUserId) {
        const user = await this.usersService.findOrCreateByExternalUserId(externalUserId);
        const members = await this.prisma.houseMember.findMany({
            where: { userId: user.id, removedAt: null },
            include: { roles: { select: { roleId: true } } },
        });
        const memberIds = members.map((m) => m.id);
        const roleIds = members.flatMap((m) => m.roles.map((r) => r.roleId));
        if (memberIds.length === 0 && roleIds.length === 0) {
            return [];
        }
        const now = new Date();
        return this.prisma.accessRight.findMany({
            where: {
                AND: [
                    {
                        OR: [
                            ...(memberIds.length > 0 ? [{ houseMemberId: { in: memberIds } }] : []),
                            ...(roleIds.length > 0 ? [{ roleId: { in: roleIds } }] : []),
                        ],
                    },
                    { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
                ],
            },
            include: this.accessRightWithResourceInclude,
            orderBy: { createdAt: 'desc' },
        });
    }
    async rebuildCache() {
        await this.prisma.effectivePermission.deleteMany({});
        const rights = await this.prisma.accessRight.findMany({
            where: { houseMemberId: { not: null } },
        });
        for (const r of rights) {
            await this.prisma.effectivePermission.upsert({
                where: {
                    houseMemberId_resourceId_accessRightType: {
                        houseMemberId: r.houseMemberId,
                        resourceId: r.resourceId,
                        accessRightType: r.accessRightType,
                    },
                },
                create: {
                    houseMemberId: r.houseMemberId,
                    resourceId: r.resourceId,
                    accessRightType: r.accessRightType,
                    sourceType: client_1.PermissionSourceType.DIRECT,
                    sourceId: r.id,
                    expiresAt: r.expiresAt,
                },
                update: {
                    sourceType: client_1.PermissionSourceType.DIRECT,
                    sourceId: r.id,
                    expiresAt: r.expiresAt,
                },
            });
        }
    }
    async getAccessStructure(externalUserId) {
        const rights = await this.findByUserId(externalUserId);
        const allowedIds = new Set(rights.map((r) => r.resourceId));
        if (allowedIds.size === 0) {
            return { houses: [] };
        }
        const resources = await this.prisma.resource.findMany({
            where: { id: { in: Array.from(allowedIds) } },
        });
        const houseIds = [...new Set(resources.map((r) => r.houseId))];
        const houses = await this.prisma.house.findMany({
            where: { id: { in: houseIds } },
            select: { id: true, name: true },
        });
        const houseMap = new Map(houses.map((h) => [h.id, h]));
        const result = [];
        for (const houseId of houseIds) {
            const tree = await this.resourcesService.getTreeByHouseId(houseId);
            const hasAllowedDescendant = (node) => {
                if (allowedIds.has(node.id))
                    return true;
                for (const ch of node.children) {
                    if (hasAllowedDescendant(ch))
                        return true;
                }
                return false;
            };
            const filterTree = (nodes) => {
                return nodes
                    .filter((n) => hasAllowedDescendant(n))
                    .map((n) => ({
                    ...n,
                    children: filterTree(n.children),
                }));
            };
            const filtered = filterTree(tree);
            const toRoom = (n) => ({
                id: n.id,
                name: n.name,
                externalId: n.externalId,
                devices: n.children.filter((c) => c.type === 'DEVICE').map(toDevice),
            });
            const toDevice = (n) => ({
                id: n.id,
                externalId: n.externalId,
                functions: n.children.filter((c) => c.type === 'DEVICE_FUNCTION').map(toFunc),
            });
            const toFunc = (n) => ({
                id: n.id,
                externalId: n.externalId,
            });
            const houseRoot = filtered.find((r) => r.type === 'HOUSE') ?? filtered[0];
            const rooms = houseRoot ? houseRoot.children.filter((c) => c.type === 'ROOM').map(toRoom) : [];
            const house = houseMap.get(houseId);
            result.push({
                id: houseId,
                name: house?.name ?? houseId,
                rooms,
            });
        }
        return { houses: result };
    }
};
exports.PermissionsService = PermissionsService;
exports.PermissionsService = PermissionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        resources_service_1.ResourcesService,
        house_members_service_1.HouseMembersService,
        house_roles_service_1.HouseRolesService,
        users_service_1.UsersService,
        audit_service_1.AuditService])
], PermissionsService);
