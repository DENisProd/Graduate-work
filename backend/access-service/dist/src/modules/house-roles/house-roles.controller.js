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
exports.HouseRolesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const house_roles_service_1 = require("./house-roles.service");
const house_role_dto_1 = require("./dto/house-role.dto");
const user_id_decorator_1 = require("../common/decorators/user-id.decorator");
let HouseRolesController = class HouseRolesController {
    constructor(houseRolesService) {
        this.houseRolesService = houseRolesService;
    }
    async findByHouseId(houseId) {
        const roles = await this.houseRolesService.findByHouseId(houseId);
        return roles.map((r) => ({
            id: r.id,
            name: r.name,
            houseId: r.houseId,
            priority: r.priority,
            isSystem: r.isSystem,
            permissions: r.permissions.map((p) => p.permission),
        }));
    }
    async create(houseId, dto, editorUserId) {
        const role = await this.houseRolesService.createCustomRole(houseId, dto.name, dto.priority, editorUserId);
        return {
            id: role.id,
            name: role.name,
            houseId: role.houseId,
            priority: role.priority,
            isSystem: role.isSystem,
            permissions: role.permissions.map((p) => p.permission),
        };
    }
    async delete(roleId) {
        await this.houseRolesService.deleteRole(roleId);
    }
    async assignRole(memberId, roleId, editorUserId) {
        await this.houseRolesService.assignRoleToMember(memberId, roleId, editorUserId);
    }
    async unassignRole(memberId, roleId, editorUserId) {
        await this.houseRolesService.unassignRoleFromMember(memberId, roleId, editorUserId);
    }
};
exports.HouseRolesController = HouseRolesController;
__decorate([
    (0, common_1.Get)('house/:houseId'),
    (0, swagger_1.ApiOperation)({ summary: 'Список ролей дома' }),
    (0, swagger_1.ApiParam)({ name: 'houseId', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' }),
    (0, swagger_1.ApiOkResponse)({ type: house_role_dto_1.HouseRoleResponseDto, isArray: true }),
    __param(0, (0, common_1.Param)('houseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HouseRolesController.prototype, "findByHouseId", null);
__decorate([
    (0, common_1.Post)('house/:houseId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Создать кастомную роль' }),
    (0, swagger_1.ApiParam)({ name: 'houseId', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' }),
    (0, swagger_1.ApiCreatedResponse)({ type: house_role_dto_1.HouseRoleResponseDto }),
    __param(0, (0, common_1.Param)('houseId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, house_role_dto_1.CreateHouseRoleRequestDto, String]),
    __metadata("design:returntype", Promise)
], HouseRolesController.prototype, "create", null);
__decorate([
    (0, common_1.Delete)(':roleId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Удалить роль (системные удалять нельзя)' }),
    (0, swagger_1.ApiParam)({ name: 'roleId', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' }),
    (0, swagger_1.ApiNoContentResponse)({ description: 'Роль удалена' }),
    __param(0, (0, common_1.Param)('roleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HouseRolesController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)('members/:memberId/roles/:roleId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Назначить роль участнику' }),
    (0, swagger_1.ApiParam)({ name: 'memberId', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' }),
    (0, swagger_1.ApiParam)({ name: 'roleId', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440001' }),
    (0, swagger_1.ApiNoContentResponse)({ description: 'Роль назначена' }),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, common_1.Param)('roleId')),
    __param(2, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], HouseRolesController.prototype, "assignRole", null);
__decorate([
    (0, common_1.Delete)('members/:memberId/roles/:roleId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Снять роль с участника' }),
    (0, swagger_1.ApiParam)({ name: 'memberId', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' }),
    (0, swagger_1.ApiParam)({ name: 'roleId', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440001' }),
    (0, swagger_1.ApiNoContentResponse)({ description: 'Роль снята' }),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, common_1.Param)('roleId')),
    __param(2, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], HouseRolesController.prototype, "unassignRole", null);
exports.HouseRolesController = HouseRolesController = __decorate([
    (0, swagger_1.ApiTags)('House Roles'),
    (0, common_1.Controller)('house-roles'),
    __metadata("design:paramtypes", [house_roles_service_1.HouseRolesService])
], HouseRolesController);
