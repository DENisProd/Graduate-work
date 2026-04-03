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
exports.PoliciesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const policies_service_1 = require("./policies.service");
const create_policy_dto_1 = require("./dto/create-policy.dto");
const policy_response_dto_1 = require("./dto/policy-response.dto");
const user_id_decorator_1 = require("../common/decorators/user-id.decorator");
const toResponse = (p) => ({
    id: p.id,
    houseId: p.houseId,
    name: p.name,
    effect: p.effect,
    subjectType: p.subjectType,
    subjectId: p.subjectId ?? undefined,
    resourceId: p.resourceId ?? undefined,
    condition: p.condition ?? undefined,
    priority: p.priority,
    createdAt: p.createdAt.toISOString(),
});
let PoliciesController = class PoliciesController {
    constructor(policiesService) {
        this.policiesService = policiesService;
    }
    async create(dto, actorId) {
        const policy = await this.policiesService.create(dto, actorId);
        return toResponse(policy);
    }
    async findByHouseId(houseId) {
        const policies = await this.policiesService.findByHouseId(houseId);
        return policies.map(toResponse);
    }
    async delete(id) {
        await this.policiesService.delete(id);
    }
};
exports.PoliciesController = PoliciesController;
__decorate([
    (0, common_1.Post)('policies'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: 'Создать политику доступа (ABAC)',
        description: 'Требуется заголовок X-User-Id (кто выполняет операцию).',
    }),
    (0, swagger_1.ApiBody)({ type: create_policy_dto_1.CreatePolicyDto }),
    (0, swagger_1.ApiCreatedResponse)({ type: policy_response_dto_1.PolicyResponseDto, description: 'Политика создана' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_policy_dto_1.CreatePolicyDto, String]),
    __metadata("design:returntype", Promise)
], PoliciesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('houses/:houseId/policies'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить политики дома' }),
    (0, swagger_1.ApiParam)({ name: 'houseId', format: 'uuid' }),
    (0, swagger_1.ApiOkResponse)({ type: policy_response_dto_1.PolicyResponseDto, isArray: true }),
    __param(0, (0, common_1.Param)('houseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PoliciesController.prototype, "findByHouseId", null);
__decorate([
    (0, common_1.Delete)('policies/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Удалить политику' }),
    (0, swagger_1.ApiParam)({ name: 'id', format: 'uuid' }),
    (0, swagger_1.ApiNoContentResponse)({ description: 'Политика удалена' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PoliciesController.prototype, "delete", null);
exports.PoliciesController = PoliciesController = __decorate([
    (0, swagger_1.ApiTags)('Policies'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [policies_service_1.PoliciesService])
], PoliciesController);
