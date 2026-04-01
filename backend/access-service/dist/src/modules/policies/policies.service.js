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
exports.PoliciesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const resources_service_1 = require("../resources/resources.service");
const exceptions_1 = require("../common/exceptions");
const audit_service_1 = require("../audit/audit.service");
let PoliciesService = class PoliciesService {
    constructor(prisma, resourcesService, auditService) {
        this.prisma = prisma;
        this.resourcesService = resourcesService;
        this.auditService = auditService;
    }
    async create(dto, actorId) {
        const resource = await this.resourcesService.findById(dto.resourceId);
        const policy = await this.prisma.accessPolicy.create({
            data: {
                houseId: resource.houseId,
                name: dto.name,
                effect: dto.effect,
                subjectType: dto.subjectType,
                subjectId: dto.subjectId,
                resourceId: resource.id,
                condition: dto.condition,
                priority: dto.priority,
            },
        });
        await this.auditService.log(actorId ?? 'system', audit_service_1.AUDIT_ACTIONS.POLICY_CREATED, policy.id, {
            houseId: resource.houseId,
            policyName: policy.name,
        });
        return policy;
    }
    async findByHouseId(houseId) {
        return this.prisma.accessPolicy.findMany({
            where: { houseId },
            orderBy: { priority: 'asc' },
        });
    }
    async delete(id) {
        const policy = await this.prisma.accessPolicy.findUnique({ where: { id } });
        if (!policy) {
            throw new exceptions_1.ResourceNotFoundException('Политика доступа', 'id', id);
        }
        await this.prisma.accessPolicy.delete({ where: { id } });
    }
};
exports.PoliciesService = PoliciesService;
exports.PoliciesService = PoliciesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        resources_service_1.ResourcesService,
        audit_service_1.AuditService])
], PoliciesService);
