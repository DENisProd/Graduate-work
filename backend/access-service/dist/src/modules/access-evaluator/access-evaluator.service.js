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
exports.AccessEvaluatorService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
const resources_service_1 = require("../resources/resources.service");
const users_service_1 = require("../users/users.service");
const house_members_service_1 = require("../house-members/house-members.service");
let AccessEvaluatorService = class AccessEvaluatorService {
    constructor(prisma, resourcesService, usersService, membersService) {
        this.prisma = prisma;
        this.resourcesService = resourcesService;
        this.usersService = usersService;
        this.membersService = membersService;
    }
    actionAllowedByType(type, action) {
        if (type === client_1.AccessRightType.DENY)
            return false;
        if (type === client_1.AccessRightType.ALLOW)
            return true;
        if (type === client_1.AccessRightType.READ)
            return action === 'READ';
        if (type === client_1.AccessRightType.WRITE)
            return action === 'WRITE';
        return false;
    }
    sortBySpecificity(arr) {
        return [...arr].sort((a, b) => {
            if (a.resource.depth !== b.resource.depth) {
                return b.resource.depth - a.resource.depth;
            }
            const prio = (t) => t === client_1.AccessRightType.DENY ? 0 : t === client_1.AccessRightType.ALLOW ? 1 : 2;
            return prio(a.accessRightType) - prio(b.accessRightType);
        });
    }
    decideFromList(list, action) {
        if (list.length === 0)
            return { allowed: false };
        for (const r of list) {
            if (r.accessRightType === client_1.AccessRightType.DENY) {
                return { allowed: false, type: r.accessRightType };
            }
        }
        for (const r of list) {
            if (this.actionAllowedByType(r.accessRightType, action)) {
                return { allowed: true, type: r.accessRightType };
            }
        }
        return { allowed: false };
    }
    async check(dto) {
        const resource = await this.resourcesService.findById(dto.resourceId);
        const user = await this.usersService.findByExternalUserId(dto.userId);
        const member = await this.prisma.houseMember.findFirst({
            where: { houseId: resource.houseId, userId: user.id },
            include: { roles: true },
        });
        if (!member) {
            return { allowed: false, source: 'NONE' };
        }
        const chain = [];
        let current = resource;
        while (current) {
            chain.push(current.id);
            if (!current.parentId)
                break;
            const parent = await this.prisma.resource.findUnique({ where: { id: current.parentId } });
            if (!parent)
                break;
            current = parent;
        }
        const eff = await this.prisma.effectivePermission.findMany({
            where: {
                houseMemberId: member.id,
                resourceId: { in: chain },
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
            include: { resource: { select: { depth: true } } },
        });
        const effSorted = this.sortBySpecificity(eff);
        const effDecision = this.decideFromList(effSorted, dto.action);
        if (effDecision.type) {
            return { allowed: effDecision.allowed, source: 'EFFECTIVE', rightType: effDecision.type };
        }
        const roleIds = member.roles.map((r) => r.roleId);
        const rights = await this.prisma.accessRight.findMany({
            where: {
                AND: [
                    {
                        resourceId: { in: chain },
                        OR: [
                            { houseMemberId: member.id },
                            ...(roleIds.length > 0 ? [{ roleId: { in: roleIds } }] : []),
                        ],
                    },
                    { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
                ],
            },
            include: { resource: { select: { depth: true } } },
        });
        const rightsSorted = this.sortBySpecificity(rights);
        const rightsDecision = this.decideFromList(rightsSorted, dto.action);
        if (rightsDecision.type) {
            return { allowed: rightsDecision.allowed, source: 'ACCESS_RIGHT', rightType: rightsDecision.type };
        }
        const policies = await this.prisma.accessPolicy.findMany({
            where: {
                houseId: resource.houseId,
                OR: [
                    { resourceId: null },
                    { resourceId: { in: chain } },
                ],
            },
            include: { resource: { select: { depth: true } } },
        });
        const applicable = policies.filter((p) => {
            if (p.subjectId == null)
                return true;
            switch (p.subjectType) {
                case 'USER':
                    return p.subjectId === user.id;
                case 'MEMBER':
                    return p.subjectId === member.id;
                case 'ROLE':
                    return member.roles.some((r) => r.roleId === p.subjectId);
                case 'ANYONE':
                    return true;
                default:
                    return false;
            }
        });
        applicable.sort((a, b) => a.priority - b.priority);
        if (applicable.length > 0) {
            const p = applicable[0];
            const allowed = this.actionAllowedByType(p.effect, dto.action);
            return { allowed, source: 'POLICY', rightType: p.effect };
        }
        return { allowed: false, source: 'NONE' };
    }
    async checkByDeviceFunction(dto) {
        const resource = await this.resourcesService.findDeviceFunctionByExternalOrId(dto.deviceFunctionId);
        const decision = await this.check({
            userId: dto.userId,
            resourceId: resource.id,
            action: dto.action,
        });
        return { allow: decision.allowed, deny: !decision.allowed };
    }
};
exports.AccessEvaluatorService = AccessEvaluatorService;
exports.AccessEvaluatorService = AccessEvaluatorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        resources_service_1.ResourcesService,
        users_service_1.UsersService,
        house_members_service_1.HouseMembersService])
], AccessEvaluatorService);
