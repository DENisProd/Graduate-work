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
exports.AdminDeviceCategoriesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const device_categories_service_1 = require("../device-categories/device-categories.service");
const page_response_dto_1 = require("../devices/dto/page-response.dto");
const device_category_request_dto_1 = require("../devices/dto/device-category-request.dto");
let AdminDeviceCategoriesController = class AdminDeviceCategoriesController {
    constructor(service) {
        this.service = service;
    }
    findAll(page = 0, size = 20) {
        const p = Number(page) || 0;
        const s = Number(size) || 20;
        return this.service.findAll(p, s);
    }
    findAllList() {
        return this.service.findAllFull();
    }
    findByDeviceTypeId(deviceTypeId) {
        return this.service.findByDeviceTypeIdFull(Number(deviceTypeId));
    }
    findByCode(code) {
        return this.service.findByCodeFull(code);
    }
    findById(id) {
        return this.service.findByIdFull(Number(id));
    }
    create(body) {
        return this.service.create(body);
    }
    update(id, body) {
        return this.service.update(Number(id), body);
    }
    async delete(id) {
        await this.service.delete(Number(id));
    }
};
exports.AdminDeviceCategoriesController = AdminDeviceCategoriesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Список категорий (админ, постранично)' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, example: 0 }),
    (0, swagger_1.ApiQuery)({ name: 'size', required: false, example: 20 }),
    (0, swagger_1.ApiOkResponse)({ description: 'Страница категорий', type: page_response_dto_1.PageResponse }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('size')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminDeviceCategoriesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('all'),
    (0, swagger_1.ApiOperation)({ summary: 'Все категории (админ, полные сущности)' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Массив категорий' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminDeviceCategoriesController.prototype, "findAllList", null);
__decorate([
    (0, common_1.Get)('by-type/:deviceTypeId'),
    (0, swagger_1.ApiOperation)({ summary: 'Категории по типу устройства (админ)' }),
    (0, swagger_1.ApiParam)({ name: 'deviceTypeId', description: 'ID типа' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Массив категорий' }),
    __param(0, (0, common_1.Param)('deviceTypeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminDeviceCategoriesController.prototype, "findByDeviceTypeId", null);
__decorate([
    (0, common_1.Get)('code/:code'),
    (0, swagger_1.ApiOperation)({ summary: 'Категория по коду (админ)' }),
    (0, swagger_1.ApiParam)({ name: 'code', example: 'TEMP_SENSOR' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Категория' }),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminDeviceCategoriesController.prototype, "findByCode", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Категория по ID (админ)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID категории' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Категория' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminDeviceCategoriesController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Создать категорию' }),
    (0, swagger_1.ApiBody)({ type: device_category_request_dto_1.DeviceCategoryRequest }),
    (0, swagger_1.ApiOkResponse)({ description: 'Созданная категория' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [device_category_request_dto_1.DeviceCategoryRequest]),
    __metadata("design:returntype", Promise)
], AdminDeviceCategoriesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Обновить категорию' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID категории' }),
    (0, swagger_1.ApiBody)({ type: device_category_request_dto_1.DeviceCategoryRequest }),
    (0, swagger_1.ApiOkResponse)({ description: 'Обновлённая категория' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, device_category_request_dto_1.DeviceCategoryRequest]),
    __metadata("design:returntype", Promise)
], AdminDeviceCategoriesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Удалить категорию' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID категории' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Удалено' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminDeviceCategoriesController.prototype, "delete", null);
exports.AdminDeviceCategoriesController = AdminDeviceCategoriesController = __decorate([
    (0, swagger_1.ApiTags)('Admin — device categories'),
    (0, common_1.Controller)('api/v1/admin/device-categories'),
    __metadata("design:paramtypes", [device_categories_service_1.DeviceCategoriesService])
], AdminDeviceCategoriesController);
