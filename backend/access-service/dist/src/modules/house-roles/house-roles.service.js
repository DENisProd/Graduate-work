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
exports.HouseRolesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const houses_service_1 = require("../houses/houses.service");
const exceptions_1 = require("../common/exceptions");
const client_1 = require("@prisma/client");
const constants_1 = require("./constants");
let HouseRolesService = class HouseRolesService {
    constructor(prisma, housesService) {
        this.prisma = prisma;
        this.housesService = housesService;
    }
    async createDefaultRolesForHouse(houseId, ownerMemberId) {
        await this.housesService.findById(houseId);
        const roleNames = [constants_1.SYSTEM_ROLE_NAMES.OWNER, constants_1.SYSTEM_ROLE_NAMES.ADMIN, constants_1.SYSTEM_ROLE_NAMES.DEFAULT];
        let ownerRoleId;
        for (const name of roleNames) {
            const priority = constants_1.SYSTEM_ROLE_PRIORITIES[name];
            const permissions = constants_1.SYSTEM_ROLE_PERMISSIONS[name] ?? [];
            const role = await this.prisma.houseRole.create({
                data: {
                    name,
                    houseId,
                    priority,
                    isSystem: true,
                    permissions: {
                        create: permissions.map((permission) => ({ permission })),
                    },
                },
            });
            if (name === constants_1.SYSTEM_ROLE_NAMES.OWNER) {
                ownerRoleId = role.id;
                await this.prisma.houseMemberRole.create({
                    data: { houseMemberId: ownerMemberId, roleId: role.id },
                });
            }
        }
        if (ownerRoleId) {
            await this.grantOwnerFullResourceAccess(houseId, ownerMemberId, ownerRoleId);
        }
    }
    async ensureOwnerFullAccessForHouse(houseId) {
        const house = await this.prisma.house.findUnique({
            where: { id: houseId },
            select: { ownerId: true },
        });
        if (!house?.ownerId)
            return;
        const ownerMember = await this.prisma.houseMember.findFirst({
            where: { houseId, userId: house.ownerId, removedAt: null },
        });
        if (!ownerMember)
            return;
        const ownerRole = await this.prisma.houseRole.findFirst({
            where: { houseId, name: constants_1.SYSTEM_ROLE_NAMES.OWNER },
        });
        if (!ownerRole)
            return;
        await this.grantOwnerFullResourceAccess(houseId, ownerMember.id, ownerRole.id);
    }
    async grantOwnerFullResourceAccess(houseId, ownerMemberId, ownerRoleId) {
        let root = await this.prisma.resource.findFirst({
            where: { houseId, type: client_1.ResourceType.HOUSE, parentId: null },
        });
        if (!root) {
            root = await this.prisma.resource.create({
                data: {
                    houseId,
                    type: client_1.ResourceType.HOUSE,
                    path: `/${houseId}`,
                    depth: 0,
                },
            });
        }
        let right = await this.prisma.accessRight.findFirst({
            where: {
                resourceId: root.id,
                roleId: ownerRoleId,
                accessRightType: client_1.AccessRightType.ALLOW,
            },
        });
        if (!right) {
            right = await this.prisma.accessRight.create({
                data: {
                    resourceId: root.id,
                    roleId: ownerRoleId,
                    accessRightType: client_1.AccessRightType.ALLOW,
                },
            });
        }
        await this.prisma.effectivePermission.upsert({
            where: {
                houseMemberId_resourceId_accessRightType: {
                    houseMemberId: ownerMemberId,
                    resourceId: root.id,
                    accessRightType: client_1.AccessRightType.ALLOW,
                },
            },
            create: {
                houseMemberId: ownerMemberId,
                resourceId: root.id,
                accessRightType: client_1.AccessRightType.ALLOW,
                sourceType: client_1.PermissionSourceType.ROLE,
                sourceId: right.id,
            },
            update: {
                sourceType: client_1.PermissionSourceType.ROLE,
                sourceId: right.id,
            },
        });
    }
    async getRoleByHouseAndName(houseId, name) {
        const role = await this.prisma.houseRole.findFirst({
            where: { houseId, name },
            include: { permissions: true },
        });
        if (!role) {
            throw new exceptions_1.ResourceNotFoundException('Роль дома', 'name', name);
        }
        return role;
    }
    async getDefaultRoleForHouse(houseId) {
        return this.getRoleByHouseAndName(houseId, constants_1.SYSTEM_ROLE_NAMES.DEFAULT);
    }
    async getNextAvailablePriority(houseId) {
        const agg = await this.prisma.houseRole.aggregate({
            where: { houseId },
            _max: { priority: true },
        });
        return (agg._max.priority ?? 0) + 1;
    }
    async canAssignRoleForInvitation(houseId, inviterUserId, roleId) {
        const isOwner = await this.housesService.isOwner(houseId, inviterUserId);
        if (isOwner)
            return true;
        const role = await this.findById(roleId);
        if (role.houseId !== houseId)
            return false;
        const inviterMember = await this.prisma.houseMember.findFirst({
            where: { houseId, user: { externalUserId: inviterUserId }, removedAt: null },
        });
        if (!inviterMember)
            return false;
        const inviterPriority = await this.getMemberBestPriority(houseId, inviterMember.id);
        return inviterPriority < role.priority;
    }
    async assertCanInviteWithPermissions(houseId, inviterUserId, permissions) {
        if (permissions.length === 0)
            return;
        const isOwner = await this.housesService.isOwner(houseId, inviterUserId);
        if (isOwner)
            return;
        for (const p of permissions) {
            const ok = await this.hasPermission(houseId, inviterUserId, p);
            if (!ok) {
                throw new exceptions_1.ForbiddenException(`Недостаточно прав, чтобы передать приглашённому право: ${p}`);
            }
        }
    }
    async getMemberBestPriority(houseId, memberId) {
        const member = await this.prisma.houseMember.findFirst({
            where: { id: memberId, houseId },
            include: { roles: { include: { role: true } } },
        });
        if (!member || member.roles.length === 0)
            return 9999;
        return Math.min(...member.roles.map((r) => r.role.priority));
    }
    async hasPermission(houseId, userId, permission) {
        const member = await this.prisma.houseMember.findFirst({
            where: { houseId, user: { externalUserId: userId } },
            include: { roles: { include: { role: { include: { permissions: true } } } } },
        });
        if (!member)
            return false;
        return member.roles.some((mr) => mr.role.permissions.some((p) => p.permission === permission));
    }
    async canEditMemberRights(houseId, editorUserId, targetMemberId) {
        const isOwner = await this.housesService.isOwner(houseId, editorUserId);
        if (isOwner)
            return true;
        const hasEdit = await this.hasPermission(houseId, editorUserId, client_1.HousePermission.EDIT_ROLES);
        if (!hasEdit)
            return false;
        const editorMember = await this.prisma.houseMember.findFirst({
            where: { houseId, user: { externalUserId: editorUserId } },
        });
        if (!editorMember)
            return false;
        const editorPriority = await this.getMemberBestPriority(houseId, editorMember.id);
        const targetPriority = await this.getMemberBestPriority(houseId, targetMemberId);
        return editorPriority < targetPriority;
    }
    async canInviteMembers(houseId, userId) {
        const isOwner = await this.housesService.isOwner(houseId, userId);
        if (isOwner)
            return true;
        return this.hasPermission(houseId, userId, client_1.HousePermission.INVITE_MEMBERS);
    }
    async canEditRoleRights(houseId, editorUserId, roleId) {
        const isOwner = await this.housesService.isOwner(houseId, editorUserId);
        if (isOwner)
            return true;
        const hasEdit = await this.hasPermission(houseId, editorUserId, client_1.HousePermission.EDIT_ROLES);
        if (!hasEdit)
            return false;
        const role = await this.findById(roleId);
        if (role.houseId !== houseId)
            return false;
        const editorMember = await this.prisma.houseMember.findFirst({
            where: { houseId, user: { externalUserId: editorUserId } },
        });
        if (!editorMember)
            return false;
        const editorPriority = await this.getMemberBestPriority(houseId, editorMember.id);
        return editorPriority < role.priority;
    }
    async findById(roleId) {
        const role = await this.prisma.houseRole.findUnique({
            where: { id: roleId },
            include: { house: true, permissions: true },
        });
        if (!role) {
            throw new exceptions_1.ResourceNotFoundException('Роль дома', 'id', roleId);
        }
        return role;
    }
    async findByHouseId(houseId) {
        await this.housesService.findById(houseId);
        return this.prisma.houseRole.findMany({
            where: { houseId },
            include: { permissions: true },
            orderBy: { priority: 'asc' },
        });
    }
    async createCustomRole(houseId, name, priority, editorUserId) {
        await this.housesService.findById(houseId);
        const canEdit = await this.hasPermission(houseId, editorUserId, client_1.HousePermission.EDIT_ROLES)
            || (await this.housesService.isOwner(houseId, editorUserId));
        if (!canEdit) {
            throw new exceptions_1.ForbiddenException('Только Владелец или Админ могут создавать кастомные роли');
        }
        const existing = await this.prisma.houseRole.findFirst({ where: { houseId, name } });
        if (existing) {
            throw new exceptions_1.BadRequestException(`Роль с именем «${name}» уже существует в этом доме`);
        }
        return this.prisma.houseRole.create({
            data: { houseId, name, priority, isSystem: false },
            include: { permissions: true },
        });
    }
    async deleteRole(roleId) {
        const role = await this.findById(roleId);
        if (role.isSystem) {
            throw new exceptions_1.ForbiddenException('Системные роли (Владелец, Админ, По умолчанию) удалять нельзя');
        }
        await this.prisma.houseRole.delete({ where: { id: roleId } });
    }
    async assignRoleToMember(memberId, roleId, editorUserId) {
        const member = await this.prisma.houseMember.findUnique({
            where: { id: memberId },
            include: { house: true },
        });
        if (!member)
            throw new exceptions_1.ResourceNotFoundException('Участник дома', 'id', memberId);
        const role = await this.findById(roleId);
        if (role.houseId !== member.houseId) {
            throw new exceptions_1.BadRequestException('Роль не принадлежит дому участника');
        }
        const canEdit = await this.canEditMemberRights(member.houseId, editorUserId, memberId);
        if (!canEdit) {
            throw new exceptions_1.ForbiddenException('Недостаточно прав для назначения этой роли');
        }
        const editorMember = await this.prisma.houseMember.findFirst({
            where: { houseId: member.houseId, user: { externalUserId: editorUserId } },
        });
        if (!editorMember)
            throw new exceptions_1.ForbiddenException('Вы не являетесь участником этого дома');
        const editorPriority = await this.getMemberBestPriority(member.houseId, editorMember.id);
        if (role.priority <= editorPriority) {
            throw new exceptions_1.ForbiddenException('Нельзя назначить роль выше или равную своей');
        }
        await this.prisma.houseMemberRole.upsert({
            where: { houseMemberId_roleId: { houseMemberId: memberId, roleId } },
            update: {},
            create: { houseMemberId: memberId, roleId },
        });
    }
    async unassignRoleFromMember(memberId, roleId, editorUserId) {
        const member = await this.prisma.houseMember.findUnique({
            where: { id: memberId },
            include: { house: true },
        });
        if (!member)
            throw new exceptions_1.ResourceNotFoundException('Участник дома', 'id', memberId);
        const role = await this.findById(roleId);
        if (role.houseId !== member.houseId) {
            throw new exceptions_1.BadRequestException('Роль не принадлежит дому участника');
        }
        if (role.isSystem) {
            throw new exceptions_1.ForbiddenException('Системную роль нельзя снять с участника через этот метод');
        }
        const canEdit = await this.canEditMemberRights(member.houseId, editorUserId, memberId);
        if (!canEdit) {
            throw new exceptions_1.ForbiddenException('Недостаточно прав для снятия роли');
        }
        await this.prisma.houseMemberRole.delete({
            where: { houseMemberId_roleId: { houseMemberId: memberId, roleId } },
        });
    }
};
exports.HouseRolesService = HouseRolesService;
exports.HouseRolesService = HouseRolesService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => houses_service_1.HousesService))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        houses_service_1.HousesService])
], HouseRolesService);
