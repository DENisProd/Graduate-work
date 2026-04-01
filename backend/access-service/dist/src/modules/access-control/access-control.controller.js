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
exports.AccessControlController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const access_control_service_1 = require("./access-control.service");
const house_access_right_request_dto_1 = require("./dto/house-access-right-request.dto");
const access_check_request_dto_1 = require("./dto/access-check-request.dto");
const access_check_response_dto_1 = require("./dto/access-check-response.dto");
const access_control_mapper_1 = require("./access-control.mapper");
const user_id_decorator_1 = require("../common/decorators/user-id.decorator");
const house_access_right_response_dto_1 = require("./dto/house-access-right-response.dto");
const RIGHTS_PAGE_EXAMPLE = {
    type: 'object',
    description: 'Страница прав (content, page, size, totalElements, …)',
    example: {
        content: [
            {
                id: '550e8400-e29b-41d4-a716-446655440000',
                houseId: '550e8400-e29b-41d4-a716-446655440001',
                houseName: 'Дом',
                accessRightType: 'ALLOW',
                createdAt: '2024-01-01 12:00:00',
                isExpired: false,
                isActive: true,
            },
        ],
        page: 0,
        size: 20,
        totalElements: 1,
        totalPages: 1,
        first: true,
        last: true,
        hasNext: false,
        hasPrevious: false,
    },
};
let AccessControlController = class AccessControlController {
    constructor(accessControlService) {
        this.accessControlService = accessControlService;
    }
    async createRight(dto, grantedByUserId) {
        const right = await this.accessControlService.createRight(dto, grantedByUserId);
        return (0, access_control_mapper_1.toHouseAccessRightResponse)(right);
    }
    async updateRight(id, dto, userId) {
        const right = await this.accessControlService.updateRight(id, dto, userId);
        return (0, access_control_mapper_1.toHouseAccessRightResponse)(right);
    }
    async deleteRight(id, userId) {
        await this.accessControlService.deleteRight(id, userId);
    }
    async getRightsByMember(memberId, page, size, sort = 'createdAt,desc') {
        const p = Math.max(0, parseInt(page || '0', 10) || 0);
        const s = Math.max(1, parseInt(size || '20', 10) || 20);
        const { content, total } = await this.accessControlService.findRightsByMemberId(memberId, p, s, sort);
        return (0, access_control_mapper_1.toHouseAccessRightPageResponse)(content, p, s, total);
    }
    async getRightsByHouse(houseId, page, size, sort = 'createdAt,desc') {
        const p = Math.max(0, parseInt(page || '0', 10) || 0);
        const s = Math.max(1, parseInt(size || '20', 10) || 20);
        const { content, total } = await this.accessControlService.findRightsByHouseId(houseId, p, s, sort);
        return (0, access_control_mapper_1.toHouseAccessRightPageResponse)(content, p, s, total);
    }
    async checkAccess(dto) {
        return this.accessControlService.checkAccess(dto);
    }
    async cleanupExpired() {
        await this.accessControlService.cleanupExpiredRights();
    }
};
exports.AccessControlController = AccessControlController;
__decorate([
    (0, common_1.Post)('rights'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Создать право доступа' }),
    (0, swagger_1.ApiCreatedResponse)({ type: house_access_right_response_dto_1.HouseAccessRightResponseDto }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [house_access_right_request_dto_1.HouseAccessRightRequestDto, String]),
    __metadata("design:returntype", Promise)
], AccessControlController.prototype, "createRight", null);
__decorate([
    (0, common_1.Put)('rights/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Обновить право доступа' }),
    (0, swagger_1.ApiParam)({ name: 'id', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' }),
    (0, swagger_1.ApiOkResponse)({ type: house_access_right_response_dto_1.HouseAccessRightResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, house_access_right_request_dto_1.HouseAccessRightRequestDto, String]),
    __metadata("design:returntype", Promise)
], AccessControlController.prototype, "updateRight", null);
__decorate([
    (0, common_1.Delete)('rights/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Удалить право доступа' }),
    (0, swagger_1.ApiParam)({ name: 'id', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' }),
    (0, swagger_1.ApiNoContentResponse)({ description: 'Право удалено' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AccessControlController.prototype, "deleteRight", null);
__decorate([
    (0, common_1.Get)('rights/member/:memberId'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить все права участника' }),
    (0, swagger_1.ApiParam)({ name: 'memberId', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, example: '0' }),
    (0, swagger_1.ApiQuery)({ name: 'size', required: false, example: '20' }),
    (0, swagger_1.ApiQuery)({ name: 'sort', required: false, example: 'createdAt,desc' }),
    (0, swagger_1.ApiOkResponse)({ schema: RIGHTS_PAGE_EXAMPLE }),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('size')),
    __param(3, (0, common_1.Query)('sort')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], AccessControlController.prototype, "getRightsByMember", null);
__decorate([
    (0, common_1.Get)('rights/house/:houseId'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить все права дома' }),
    (0, swagger_1.ApiParam)({ name: 'houseId', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, example: '0' }),
    (0, swagger_1.ApiQuery)({ name: 'size', required: false, example: '20' }),
    (0, swagger_1.ApiQuery)({ name: 'sort', required: false, example: 'createdAt,desc' }),
    (0, swagger_1.ApiOkResponse)({ schema: RIGHTS_PAGE_EXAMPLE }),
    __param(0, (0, common_1.Param)('houseId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('size')),
    __param(3, (0, common_1.Query)('sort')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], AccessControlController.prototype, "getRightsByHouse", null);
__decorate([
    (0, common_1.Post)('check'),
    (0, swagger_1.ApiOperation)({ summary: 'Проверить права доступа' }),
    (0, swagger_1.ApiOkResponse)({ type: access_check_response_dto_1.AccessCheckResponseDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [access_check_request_dto_1.AccessCheckRequestDto]),
    __metadata("design:returntype", Promise)
], AccessControlController.prototype, "checkAccess", null);
__decorate([
    (0, common_1.Post)('cleanup/expired'),
    (0, swagger_1.ApiOperation)({ summary: 'Очистить истекшие права' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Очистка выполнена (ответ без тела)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AccessControlController.prototype, "cleanupExpired", null);
exports.AccessControlController = AccessControlController = __decorate([
    (0, swagger_1.ApiTags)('Access Control'),
    (0, common_1.Controller)('access-control'),
    __metadata("design:paramtypes", [access_control_service_1.AccessControlService])
], AccessControlController);
