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
exports.HouseInvitationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const house_invitations_service_1 = require("./house-invitations.service");
const house_invitation_request_dto_1 = require("./dto/house-invitation-request.dto");
const house_invitation_response_dto_1 = require("./dto/house-invitation-response.dto");
const house_invitations_mapper_1 = require("./house-invitations.mapper");
const user_id_decorator_1 = require("../common/decorators/user-id.decorator");
let HouseInvitationsController = class HouseInvitationsController {
    constructor(houseInvitationsService) {
        this.houseInvitationsService = houseInvitationsService;
    }
    async findByToken(token) {
        const inv = await this.houseInvitationsService.findByToken(token);
        return (0, house_invitations_mapper_1.toHouseInvitationResponse)(inv);
    }
    async findByHouseId(houseId, page, size, sort = 'createdAt,desc', includeAll) {
        const p = Math.max(0, parseInt(page || '0', 10) || 0);
        const s = Math.max(1, parseInt(size || '20', 10) || 20);
        const all = includeAll === 'true' || includeAll === '1';
        const { content, total } = await this.houseInvitationsService.findByHouseId(houseId, p, s, sort, all);
        const pageResponse = (0, house_invitations_mapper_1.toHouseInvitationPageResponse)(content, p, s, total);
        return pageResponse.content;
    }
    async create(dto, invitedById) {
        const inv = await this.houseInvitationsService.create(dto, invitedById);
        return (0, house_invitations_mapper_1.toHouseInvitationResponse)(inv);
    }
    async accept(token, userId) {
        const inv = await this.houseInvitationsService.accept(token, userId);
        return (0, house_invitations_mapper_1.toHouseInvitationResponse)(inv);
    }
    async decline(token) {
        const inv = await this.houseInvitationsService.decline(token);
        return (0, house_invitations_mapper_1.toHouseInvitationResponse)(inv);
    }
    async revoke(id, userId) {
        const inv = await this.houseInvitationsService.revoke(id, userId);
        return (0, house_invitations_mapper_1.toHouseInvitationResponse)(inv);
    }
};
exports.HouseInvitationsController = HouseInvitationsController;
__decorate([
    (0, common_1.Get)('token/:token'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить приглашение по токену' }),
    (0, swagger_1.ApiParam)({ name: 'token', example: 'invite-secret-token' }),
    (0, swagger_1.ApiOkResponse)({ type: house_invitation_response_dto_1.HouseInvitationResponseDto }),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HouseInvitationsController.prototype, "findByToken", null);
__decorate([
    (0, common_1.Get)('house/:houseId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Приглашения дома',
        description: 'По умолчанию возвращаются только ожидающие и ещё действительные приглашения (PENDING, срок не истёк). Принятые и остальные завершённые не включаются. Для полной истории укажите includeAll=true.',
    }),
    (0, swagger_1.ApiParam)({ name: 'houseId', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, example: '0' }),
    (0, swagger_1.ApiQuery)({ name: 'size', required: false, example: '20' }),
    (0, swagger_1.ApiQuery)({ name: 'sort', required: false, example: 'createdAt,desc' }),
    (0, swagger_1.ApiQuery)({
        name: 'includeAll',
        required: false,
        example: 'false',
        description: 'Если true — все приглашения по дому (включая принятые, отклонённые и т.д.)',
    }),
    (0, swagger_1.ApiOkResponse)({ type: house_invitation_response_dto_1.HouseInvitationResponseDto, isArray: true }),
    __param(0, (0, common_1.Param)('houseId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('size')),
    __param(3, (0, common_1.Query)('sort')),
    __param(4, (0, common_1.Query)('includeAll')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object, String]),
    __metadata("design:returntype", Promise)
], HouseInvitationsController.prototype, "findByHouseId", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Создать приглашение' }),
    (0, swagger_1.ApiCreatedResponse)({ type: house_invitation_response_dto_1.HouseInvitationResponseDto }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [house_invitation_request_dto_1.HouseInvitationRequestDto, String]),
    __metadata("design:returntype", Promise)
], HouseInvitationsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':token/accept'),
    (0, swagger_1.ApiOperation)({ summary: 'Принять приглашение' }),
    (0, swagger_1.ApiParam)({ name: 'token', example: 'invite-secret-token' }),
    (0, swagger_1.ApiOkResponse)({ type: house_invitation_response_dto_1.HouseInvitationResponseDto }),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], HouseInvitationsController.prototype, "accept", null);
__decorate([
    (0, common_1.Post)(':token/decline'),
    (0, swagger_1.ApiOperation)({ summary: 'Отклонить приглашение' }),
    (0, swagger_1.ApiParam)({ name: 'token', example: 'invite-secret-token' }),
    (0, swagger_1.ApiOkResponse)({ type: house_invitation_response_dto_1.HouseInvitationResponseDto }),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HouseInvitationsController.prototype, "decline", null);
__decorate([
    (0, common_1.Post)(':id/revoke'),
    (0, swagger_1.ApiOperation)({ summary: 'Отозвать приглашение' }),
    (0, swagger_1.ApiParam)({ name: 'id', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' }),
    (0, swagger_1.ApiOkResponse)({ type: house_invitation_response_dto_1.HouseInvitationResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_id_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], HouseInvitationsController.prototype, "revoke", null);
exports.HouseInvitationsController = HouseInvitationsController = __decorate([
    (0, swagger_1.ApiTags)('House Invitations'),
    (0, common_1.Controller)('house-invitations'),
    __metadata("design:paramtypes", [house_invitations_service_1.HouseInvitationsService])
], HouseInvitationsController);
