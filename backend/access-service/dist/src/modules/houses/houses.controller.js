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
exports.HousesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const houses_service_1 = require("./houses.service");
const house_roles_service_1 = require("../house-roles/house-roles.service");
const house_request_dto_1 = require("./dto/house-request.dto");
const house_update_request_dto_1 = require("./dto/house-update-request.dto");
const house_response_dto_1 = require("./dto/house-response.dto");
const houses_mapper_1 = require("./houses.mapper");
let HousesController = class HousesController {
    constructor(housesService, houseRolesService) {
        this.housesService = housesService;
        this.houseRolesService = houseRolesService;
    }
    async findByUserId(userId, page, size, sort = 'createdAt,desc') {
        const p = Math.max(0, parseInt(page || '0', 10) || 0);
        const s = Math.max(1, parseInt(size || '20', 10) || 20);
        const { content, total } = await this.housesService.findByOwnerId(userId, p, s, sort);
        const pageResponse = (0, houses_mapper_1.toHousePageResponse)(content, p, s, total);
        return pageResponse.content;
    }
    async findById(id) {
        const house = await this.housesService.findById(id);
        return (0, houses_mapper_1.toHouseResponse)(house);
    }
    async create(dto) {
        const house = await this.housesService.create(dto);
        return (0, houses_mapper_1.toHouseResponse)(house);
    }
    async update(id, dto) {
        const house = await this.housesService.update(id, dto);
        return (0, houses_mapper_1.toHouseResponse)(house);
    }
    async delete(id) {
        await this.housesService.delete(id);
    }
};
exports.HousesController = HousesController;
__decorate([
    (0, common_1.Get)('user/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Дома пользователя (владелец или участник), внешний userId' }),
    (0, swagger_1.ApiParam)({ name: 'userId', format: 'uuid', example: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, example: '0' }),
    (0, swagger_1.ApiQuery)({ name: 'size', required: false, example: '20' }),
    (0, swagger_1.ApiQuery)({ name: 'sort', required: false, example: 'createdAt,desc' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Только массив домов', type: house_response_dto_1.HouseResponseDto, isArray: true }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('size')),
    __param(3, (0, common_1.Query)('sort')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], HousesController.prototype, "findByUserId", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить дом по ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' }),
    (0, swagger_1.ApiOkResponse)({ type: house_response_dto_1.HouseResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HousesController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Создать дом' }),
    (0, swagger_1.ApiCreatedResponse)({ type: house_response_dto_1.HouseResponseDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [house_request_dto_1.HouseRequestDto]),
    __metadata("design:returntype", Promise)
], HousesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Обновить дом' }),
    (0, swagger_1.ApiParam)({ name: 'id', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' }),
    (0, swagger_1.ApiOkResponse)({ type: house_response_dto_1.HouseResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, house_update_request_dto_1.HouseUpdateRequestDto]),
    __metadata("design:returntype", Promise)
], HousesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Удалить дом' }),
    (0, swagger_1.ApiParam)({ name: 'id', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' }),
    (0, swagger_1.ApiNoContentResponse)({ description: 'Дом удалён' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HousesController.prototype, "delete", null);
exports.HousesController = HousesController = __decorate([
    (0, swagger_1.ApiTags)('Houses'),
    (0, common_1.Controller)('houses'),
    __metadata("design:paramtypes", [houses_service_1.HousesService,
        house_roles_service_1.HouseRolesService])
], HousesController);
