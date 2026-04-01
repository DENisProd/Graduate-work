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
exports.HouseMembersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const house_members_service_1 = require("./house-members.service");
const house_members_mapper_1 = require("./house-members.mapper");
const houses_service_1 = require("../houses/houses.service");
const house_member_response_dto_1 = require("./dto/house-member-response.dto");
const HOUSE_PAGE_EXAMPLE = {
    type: 'object',
    example: {
        content: [
            {
                id: '550e8400-e29b-41d4-a716-446655440000',
                name: 'Загородный дом',
                ownerId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
                createdAt: '2024-01-01 12:00:00',
                updatedAt: '2024-01-01 12:00:00',
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
let HouseMembersController = class HouseMembersController {
    constructor(houseMembersService, housesService) {
        this.houseMembersService = houseMembersService;
        this.housesService = housesService;
    }
    async findByHouseId(houseId, page, size, sort = 'joinedAt,desc') {
        const p = Math.max(0, parseInt(page || '0', 10) || 0);
        const s = Math.max(1, parseInt(size || '20', 10) || 20);
        const { content } = await this.houseMembersService.findByHouseId(houseId, p, s, sort);
        return content.map(house_members_mapper_1.toHouseMemberListItemResponse);
    }
    async findById(id) {
        const data = await this.houseMembersService.findByIdWithAccessDetails(id);
        return (0, house_members_mapper_1.toHouseMemberDetailResponse)(data);
    }
    async addMember(houseId, userId) {
        const member = await this.houseMembersService.addMember(houseId, userId);
        return (0, house_members_mapper_1.toHouseMemberResponse)(member);
    }
    async removeMember(houseId, userId) {
        await this.houseMembersService.removeMember(houseId, userId);
    }
};
exports.HouseMembersController = HouseMembersController;
__decorate([
    (0, common_1.Get)('house/:houseId'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить всех участников дома' }),
    (0, swagger_1.ApiParam)({ name: 'houseId', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, example: '0' }),
    (0, swagger_1.ApiQuery)({ name: 'size', required: false, example: '20' }),
    (0, swagger_1.ApiQuery)({ name: 'sort', required: false, example: 'joinedAt,desc' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Только массив участников', type: house_member_response_dto_1.HouseMemberListItemDto, isArray: true }),
    __param(0, (0, common_1.Param)('houseId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('size')),
    __param(3, (0, common_1.Query)('sort')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], HouseMembersController.prototype, "findByHouseId", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить участника по ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' }),
    (0, swagger_1.ApiOkResponse)({ type: house_member_response_dto_1.HouseMemberDetailResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HouseMembersController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Добавить участника в дом' }),
    (0, swagger_1.ApiQuery)({ name: 'houseId', required: true, example: '550e8400-e29b-41d4-a716-446655440000' }),
    (0, swagger_1.ApiQuery)({ name: 'userId', required: true, example: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' }),
    (0, swagger_1.ApiCreatedResponse)({ type: house_member_response_dto_1.HouseMemberResponseDto }),
    __param(0, (0, common_1.Query)('houseId')),
    __param(1, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], HouseMembersController.prototype, "addMember", null);
__decorate([
    (0, common_1.Delete)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Удалить участника из дома' }),
    (0, swagger_1.ApiQuery)({ name: 'houseId', required: true, example: '550e8400-e29b-41d4-a716-446655440000' }),
    (0, swagger_1.ApiQuery)({ name: 'userId', required: true, example: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' }),
    (0, swagger_1.ApiNoContentResponse)({ description: 'Участник удалён' }),
    __param(0, (0, common_1.Query)('houseId')),
    __param(1, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], HouseMembersController.prototype, "removeMember", null);
exports.HouseMembersController = HouseMembersController = __decorate([
    (0, swagger_1.ApiTags)('House Members'),
    (0, common_1.Controller)('house-members'),
    __metadata("design:paramtypes", [house_members_service_1.HouseMembersService,
        houses_service_1.HousesService])
], HouseMembersController);
