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
exports.AuditService = exports.AUDIT_ACTIONS = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
exports.AUDIT_ACTIONS = {
    ROLE_CREATED: 'ROLE_CREATED',
    ROLE_DELETED: 'ROLE_DELETED',
    MEMBER_ADDED: 'MEMBER_ADDED',
    ACCESS_GRANTED: 'ACCESS_GRANTED',
    POLICY_CREATED: 'POLICY_CREATED',
    INVITATION_CREATED: 'INVITATION_CREATED',
    INVITATION_ACCEPTED: 'INVITATION_ACCEPTED',
    INVITATION_REVOKED: 'INVITATION_REVOKED',
};
let AuditService = class AuditService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async log(actorId, action, resourceId, metadata) {
        return this.prisma.accessAuditLog.create({
            data: {
                actorId,
                action,
                resourceId: resourceId ?? undefined,
                metadata: metadata ?? undefined,
            },
        });
    }
    async findAll(params) {
        const { actorId, resourceId, action, page = 0, size = 20 } = params;
        const where = {};
        if (actorId)
            where.actorId = actorId;
        if (resourceId)
            where.resourceId = resourceId;
        if (action)
            where.action = action;
        const [content, total] = await Promise.all([
            this.prisma.accessAuditLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: page * size,
                take: size,
            }),
            this.prisma.accessAuditLog.count({ where }),
        ]);
        return { content, total };
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditService);
