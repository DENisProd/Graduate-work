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
exports.DeviceCategoriesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const device_categories_service_1 = require("./device-categories.service");
const page_response_dto_1 = require("../devices/dto/page-response.dto");
let DeviceCategoriesController = class DeviceCategoriesController {
    constructor(service) {
        this.service = service;
    }
    findAll(page = 0, size = 20) {
        const p = Number(page) || 0;
        const s = Number(size) || 20;
        return this.service.findAll(p, s);
    }
    findAllList() {
        return this.service.findAllList();
    }
    findByDeviceTypeId(deviceTypeId) {
        return this.service.findByDeviceTypeId(Number(deviceTypeId));
    }
    findByCode(code) {
        return this.service.findByCode(code);
    }
    findById(id) {
        return this.service.findById(Number(id));
    }
};
exports.DeviceCategoriesController = DeviceCategoriesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Список категорий (постранично)' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, example: 0 }),
    (0, swagger_1.ApiQuery)({ name: 'size', required: false, example: 20 }),
    (0, swagger_1.ApiOkResponse)({ description: 'Страница категорий', type: page_response_dto_1.PageResponse }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('size')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DeviceCategoriesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('all'),
    (0, swagger_1.ApiOperation)({ summary: 'Все категории списком' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Массив категорий' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DeviceCategoriesController.prototype, "findAllList", null);
__decorate([
    (0, common_1.Get)('by-type/:deviceTypeId'),
    (0, swagger_1.ApiOperation)({ summary: 'Категории по типу устройства' }),
    (0, swagger_1.ApiParam)({ name: 'deviceTypeId', description: 'ID типа устройства' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Массив категорий' }),
    __param(0, (0, common_1.Param)('deviceTypeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DeviceCategoriesController.prototype, "findByDeviceTypeId", null);
__decorate([
    (0, common_1.Get)('code/:code'),
    (0, swagger_1.ApiOperation)({ summary: 'Категория по коду' }),
    (0, swagger_1.ApiParam)({ name: 'code', example: 'TEMP_SENSOR' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Категория' }),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DeviceCategoriesController.prototype, "findByCode", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Категория по ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID категории' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Категория' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DeviceCategoriesController.prototype, "findById", null);
exports.DeviceCategoriesController = DeviceCategoriesController = __decorate([
    (0, swagger_1.ApiTags)('Device categories'),
    (0, common_1.Controller)('api/v1/device-categories'),
    __metadata("design:paramtypes", [device_categories_service_1.DeviceCategoriesService])
], DeviceCategoriesController);
