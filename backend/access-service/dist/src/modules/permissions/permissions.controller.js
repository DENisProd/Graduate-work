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
exports.PermissionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const permissions_service_1 = require("./permissions.service");
const create_access_right_dto_1 = require("./dto/create-access-right.dto");
const access_right_response_dto_1 = require("./dto/access-right-response.dto");
const access_structure_response_dto_1 = require("./dto/access-structure-response.dto");
const user_id_decorator_1 = require("../common/decorators/user-id.decorator");
const toResponse = (r) => ({
    id: r.id,
    resourceId: r.resourceId,
    houseMemberId: r.houseMemberId ?? undefined,
    roleId: r.roleId ?? undefined,
    accessRightType: r.accessRightType,
    parameters: r.parameters ?? undefined,
    expiresAt: r.expiresAt ? r.expiresAt.toISOString() : undefined,
    createdAt: r.createdAt.toISOString(),
    resource: r.resource ? { type: r.resource.type, depth: r.resource.depth } : undefined,
});
let PermissionsController = class PermissionsController {
    constructor(permissionsService) {
        this.permissionsService = permissionsService;
    }
    async create(dto, grantedByUserId) {
        const right = await this.permissionsService.create(dto, grantedByUserId);
        return toResponse(right);
    }
    async getByResource(resourceId) {
        const rights = await this.permissionsService.findByResourceId(resourceId);
        return rights.map(toResponse);
    }
    async getByUser(id) {
        const rights = await this.permissionsService.findByUserId(id);
        return rights.map(toResponse);
    }
    async delete(id) {
        await this.permissionsService.delete(id);
    }
    async rebuildCache() {
        await this.permissionsService.rebuildCache();
    }
    async getAccessStructure(userId) {
        return this.permissionsService.getAccessStructure(userId);
    }
};
exports.PermissionsController = PermissionsController;
__decorate([
    (0, common_1.Post)('access-rights'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: 'Назначить право доступа ресурсу (RBAC)',
        description: 'Требуется X-User-Id — кто выдал право.',
    }),
    (0, swagger_1.ApiBody)({ type: create_access_right_dto_1.CreateAccessRightDto }),
    (0, swagger_1.ApiCreatedResponse)({ type: access_right_response_dto_1.AccessRightResponseDto }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_access_right_dto_1.CreateAccessRightDto, String]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('resources/:id/permissions'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить права доступа ресурса' }),
    (0, swagger_1.ApiParam)({ name: 'id', format: 'uuid', description: 'ID ресурса' }),
    (0, swagger_1.ApiOkResponse)({ type: access_right_response_dto_1.AccessRightResponseDto, isArray: true }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "getByResource", null);
__decorate([
    (0, common_1.Get)('access-rights/user/:id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Права доступа пользователя',
        description: 'Включая права, выданные через роли участника.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', format: 'uuid', description: 'Внутренний ID пользователя в сервисе' }),
    (0, swagger_1.ApiOkResponse)({ type: access_right_response_dto_1.AccessRightResponseDto, isArray: true }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "getByUser", null);
__decorate([
    (0, common_1.Delete)('access-rights/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Удалить право доступа' }),
    (0, swagger_1.ApiParam)({ name: 'id', format: 'uuid' }),
    (0, swagger_1.ApiNoContentResponse)({ description: 'Право удалено' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)('permissions/rebuild'),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    (0, swagger_1.ApiOperation)({ summary: 'Пересчитать кэш эффективных прав' }),
    (0, swagger_1.ApiAcceptedResponse)({ description: 'Пересчёт запущен или завершён (тело пустое)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "rebuildCache", null);
__decorate([
    (0, common_1.Get)('access-structure'),
    (0, swagger_1.ApiOperation)({
        summary: 'Структура доступа пользователя',
        description: 'Дома, комнаты, устройства и функции с учётом эффективных прав.',
    }),
    (0, swagger_1.ApiQuery)({ name: 'userId', required: true, description: 'Внутренний ID пользователя в сервисе' }),
    (0, swagger_1.ApiOkResponse)({ type: access_structure_response_dto_1.AccessStructureResponseDto }),
    __param(0, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "getAccessStructure", null);
exports.PermissionsController = PermissionsController = __decorate([
    (0, swagger_1.ApiTags)('Access Rights'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [permissions_service_1.PermissionsService])
], PermissionsController);
