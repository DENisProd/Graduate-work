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
exports.HousesAdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const houses_service_1 = require("./houses.service");
const house_response_dto_1 = require("./dto/house-response.dto");
const houses_mapper_1 = require("./houses.mapper");
let HousesAdminController = class HousesAdminController {
    constructor(housesService) {
        this.housesService = housesService;
    }
    async findAll(page, size, sort = 'createdAt,desc') {
        const p = Math.max(0, parseInt(page || '0', 10) || 0);
        const s = Math.max(1, parseInt(size || '20', 10) || 20);
        const { content, total } = await this.housesService.findAll(p, s, sort);
        const pageResponse = (0, houses_mapper_1.toHousePageResponse)(content, p, s, total);
        return pageResponse.content;
    }
    async findByOwnerId(ownerId, page, size, sort = 'createdAt,desc') {
        const p = Math.max(0, parseInt(page || '0', 10) || 0);
        const s = Math.max(1, parseInt(size || '20', 10) || 20);
        const { content, total } = await this.housesService.findByOwnerId(ownerId, p, s, sort);
        const pageResponse = (0, houses_mapper_1.toHousePageResponse)(content, p, s, total);
        return pageResponse.content;
    }
};
exports.HousesAdminController = HousesAdminController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Получить все дома (Админ)' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, example: '0' }),
    (0, swagger_1.ApiQuery)({ name: 'size', required: false, example: '20' }),
    (0, swagger_1.ApiQuery)({ name: 'sort', required: false, example: 'createdAt,desc' }),
    (0, swagger_1.ApiOkResponse)({
        description: 'Массив домов',
        type: house_response_dto_1.HouseResponseDto,
        isArray: true,
    }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('size')),
    __param(2, (0, common_1.Query)('sort')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], HousesAdminController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('owner/:ownerId'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить все дома владельца' }),
    (0, swagger_1.ApiParam)({ name: 'ownerId', format: 'uuid', example: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, example: '0' }),
    (0, swagger_1.ApiQuery)({ name: 'size', required: false, example: '20' }),
    (0, swagger_1.ApiQuery)({ name: 'sort', required: false, example: 'createdAt,desc' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Только массив домов', type: house_response_dto_1.HouseResponseDto, isArray: true }),
    __param(0, (0, common_1.Param)('ownerId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('size')),
    __param(3, (0, common_1.Query)('sort')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], HousesAdminController.prototype, "findByOwnerId", null);
exports.HousesAdminController = HousesAdminController = __decorate([
    (0, swagger_1.ApiTags)('Admin Houses'),
    (0, common_1.Controller)('admin/houses'),
    __metadata("design:paramtypes", [houses_service_1.HousesService])
], HousesAdminController);
