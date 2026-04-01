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
exports.HouseInvitationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const houses_service_1 = require("../houses/houses.service");
const house_members_service_1 = require("../house-members/house-members.service");
const house_roles_service_1 = require("../house-roles/house-roles.service");
const exceptions_1 = require("../common/exceptions");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const INCLUDE = {
    house: true,
    invitedBy: { include: { user: true } },
    role: { include: { permissions: true } },
};
let HouseInvitationsService = class HouseInvitationsService {
    constructor(prisma, housesService, houseMembersService, houseRolesService) {
        this.prisma = prisma;
        this.housesService = housesService;
        this.houseMembersService = houseMembersService;
        this.houseRolesService = houseRolesService;
    }
    async create(dto, invitedByUserId) {
        await this.housesService.findById(dto.houseId);
        const canInvite = await this.houseRolesService.canInviteMembers(dto.houseId, invitedByUserId);
        if (!canInvite) {
            throw new exceptions_1.ForbiddenException('Недостаточно прав для приглашения участников (нужна роль Владелец или Админ)');
        }
        await this.houseMembersService.findByUserIdAndHouseId(invitedByUserId, dto.houseId);
        const now = new Date();
        const activeSame = await this.prisma.houseInvitation.findMany({
            where: {
                email: dto.email,
                status: client_1.InvitationStatus.PENDING,
                OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
            },
            include: { house: true },
        });
        if (activeSame.some((i) => i.houseId === dto.houseId)) {
            throw new exceptions_1.DuplicateResourceException('Приглашение', 'email и houseId', `${dto.email}, ${dto.houseId}`);
        }
        const tokenHash = (0, crypto_1.randomUUID)();
        const expiresAt = dto.expiresAt ?? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const inviter = await this.houseMembersService.findByUserIdAndHouseId(invitedByUserId, dto.houseId);
        if (dto.roleId && dto.permissions?.length) {
            throw new exceptions_1.BadRequestException('Укажите либо roleId, либо permissions, но не оба');
        }
        if (dto.roleId) {
            const role = await this.houseRolesService.findById(dto.roleId);
            if (role.houseId !== dto.houseId) {
                throw new exceptions_1.BadRequestException('Роль не принадлежит этому дому');
            }
            const can = await this.houseRolesService.canAssignRoleForInvitation(dto.houseId, invitedByUserId, dto.roleId);
            if (!can) {
                throw new exceptions_1.ForbiddenException('Недостаточно прав, чтобы пригласить участника с этой ролью');
            }
        }
        if (dto.permissions?.length) {
            await this.houseRolesService.assertCanInviteWithPermissions(dto.houseId, invitedByUserId, dto.permissions);
        }
        const invitedPermissions = dto.roleId ? [] : [...new Set(dto.permissions ?? [])];
        return this.prisma.houseInvitation.create({
            data: {
                houseId: dto.houseId,
                email: dto.email,
                tokenHash,
                roleId: dto.roleId ?? null,
                invitedPermissions,
                status: client_1.InvitationStatus.PENDING,
                expiresAt,
                invitedById: inviter.id,
            },
            include: INCLUDE,
        });
    }
    async findByToken(token) {
        const inv = await this.prisma.houseInvitation.findFirst({
            where: { tokenHash: token },
            include: INCLUDE,
        });
        if (!inv) {
            throw new exceptions_1.ResourceNotFoundException('Приглашение', 'token', token);
        }
        return inv;
    }
    async findById(id) {
        const inv = await this.prisma.houseInvitation.findUnique({
            where: { id },
            include: INCLUDE,
        });
        if (!inv) {
            throw new exceptions_1.ResourceNotFoundException('Приглашение', 'id', id);
        }
        return inv;
    }
    async findByHouseId(houseId, page, size, sort, includeAll = false) {
        await this.housesService.findById(houseId);
        const now = new Date();
        const where = includeAll
            ? { houseId }
            : {
                houseId,
                status: client_1.InvitationStatus.PENDING,
                OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
            };
        const [sortField, sortDir] = sort.includes(',') ? sort.split(',') : ['createdAt', 'desc'];
        const orderBy = { [sortField.trim()]: sortDir?.toLowerCase() === 'asc' ? 'asc' : 'desc' };
        const [content, total] = await Promise.all([
            this.prisma.houseInvitation.findMany({
                where,
                include: INCLUDE,
                skip: page * size,
                take: size,
                orderBy,
            }),
            this.prisma.houseInvitation.count({ where }),
        ]);
        return { content: content, total };
    }
    async accept(token, userId) {
        const inv = await this.findByToken(token);
        if (inv.status !== client_1.InvitationStatus.PENDING) {
            throw new exceptions_1.BadRequestException('Приглашение уже обработано');
        }
        if (inv.expiresAt && inv.expiresAt < new Date()) {
            await this.prisma.houseInvitation.update({
                where: { id: inv.id },
                data: { status: client_1.InvitationStatus.EXPIRED },
            });
            throw new exceptions_1.BadRequestException('Приглашение истекло');
        }
        await this.houseMembersService.addMemberFromInvitation(inv.houseId, userId, {
            roleId: inv.roleId,
            invitedPermissions: inv.invitedPermissions?.length ? inv.invitedPermissions : undefined,
        });
        return this.prisma.houseInvitation.update({
            where: { id: inv.id },
            data: { status: client_1.InvitationStatus.ACCEPTED, acceptedAt: new Date() },
            include: INCLUDE,
        });
    }
    async decline(token) {
        const inv = await this.findByToken(token);
        if (inv.status !== client_1.InvitationStatus.PENDING) {
            throw new exceptions_1.BadRequestException('Приглашение уже обработано');
        }
        return this.prisma.houseInvitation.update({
            where: { id: inv.id },
            data: { status: client_1.InvitationStatus.DECLINED },
            include: INCLUDE,
        });
    }
    async revoke(id, userId) {
        const inv = await this.findById(id);
        const canInvite = await this.houseRolesService.canInviteMembers(inv.houseId, userId);
        if (!canInvite) {
            throw new exceptions_1.ForbiddenException('Недостаточно прав для отзыва приглашения (нужна роль Владелец или Админ)');
        }
        if (inv.status !== client_1.InvitationStatus.PENDING) {
            throw new exceptions_1.BadRequestException('Можно отозвать только ожидающие приглашения');
        }
        return this.prisma.houseInvitation.update({
            where: { id },
            data: { status: client_1.InvitationStatus.REVOKED },
            include: INCLUDE,
        });
    }
    async cleanupExpired() {
        const now = new Date();
        await this.prisma.houseInvitation.updateMany({
            where: {
                status: client_1.InvitationStatus.PENDING,
                expiresAt: { lt: now },
            },
            data: { status: client_1.InvitationStatus.EXPIRED },
        });
    }
};
exports.HouseInvitationsService = HouseInvitationsService;
exports.HouseInvitationsService = HouseInvitationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        houses_service_1.HousesService,
        house_members_service_1.HouseMembersService,
        house_roles_service_1.HouseRolesService])
], HouseInvitationsService);
