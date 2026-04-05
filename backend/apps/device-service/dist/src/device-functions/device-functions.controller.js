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
exports.DeviceFunctionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const device_functions_service_1 = require("./device-functions.service");
const page_response_dto_1 = require("../devices/dto/page-response.dto");
let DeviceFunctionsController = class DeviceFunctionsController {
    constructor(service) {
        this.service = service;
    }
    findAllByDeviceId(deviceId) {
        return this.service.findByDeviceId(Number(deviceId));
    }
    findWritableFunctions(deviceId) {
        return this.service.findWritableFunctions(Number(deviceId));
    }
    findByDeviceId(deviceId, page = 0, size = 20) {
        const p = Number(page) || 0;
        const s = Number(size) || 20;
        return this.service.findByDeviceIdPaged(Number(deviceId), p, s);
    }
    findByIdDetailed(id) {
        return this.service.findByIdDetailed(Number(id));
    }
    findById(id) {
        return this.service.findById(Number(id));
    }
    updateValue(id, value) {
        return this.service.updateValue(Number(id), value);
    }
};
exports.DeviceFunctionsController = DeviceFunctionsController;
__decorate([
    (0, common_1.Get)('by-device/:deviceId/all'),
    (0, swagger_1.ApiOperation)({ summary: 'Все функции устройства' }),
    (0, swagger_1.ApiParam)({ name: 'deviceId', description: 'ID устройства' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Массив функций' }),
    __param(0, (0, common_1.Param)('deviceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DeviceFunctionsController.prototype, "findAllByDeviceId", null);
__decorate([
    (0, common_1.Get)('by-device/:deviceId/writable'),
    (0, swagger_1.ApiOperation)({ summary: 'Функции устройства с возможностью записи значения' }),
    (0, swagger_1.ApiParam)({ name: 'deviceId', description: 'ID устройства' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Массив функций' }),
    __param(0, (0, common_1.Param)('deviceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DeviceFunctionsController.prototype, "findWritableFunctions", null);
__decorate([
    (0, common_1.Get)('by-device/:deviceId'),
    (0, swagger_1.ApiOperation)({ summary: 'Функции устройства (постранично)' }),
    (0, swagger_1.ApiParam)({ name: 'deviceId', description: 'ID устройства' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, example: 0 }),
    (0, swagger_1.ApiQuery)({ name: 'size', required: false, example: 20 }),
    (0, swagger_1.ApiOkResponse)({ description: 'Страница функций', type: page_response_dto_1.PageResponse }),
    __param(0, (0, common_1.Param)('deviceId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('size')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], DeviceFunctionsController.prototype, "findByDeviceId", null);
__decorate([
    (0, common_1.Get)(':id/detailed'),
    (0, swagger_1.ApiOperation)({ summary: 'Функция по ID (детально)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID функции' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Функция' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DeviceFunctionsController.prototype, "findByIdDetailed", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Функция по ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID функции' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Функция' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DeviceFunctionsController.prototype, "findById", null);
__decorate([
    (0, common_1.Patch)(':id/value'),
    (0, swagger_1.ApiOperation)({ summary: 'Обновить текущее значение функции' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID функции' }),
    (0, swagger_1.ApiQuery)({ name: 'value', description: 'Новое значение (строка)' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Обновлённая функция' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('value')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DeviceFunctionsController.prototype, "updateValue", null);
exports.DeviceFunctionsController = DeviceFunctionsController = __decorate([
    (0, swagger_1.ApiTags)('Device functions'),
    (0, common_1.Controller)('api/v1/device-functions'),
    __metadata("design:paramtypes", [device_functions_service_1.DeviceFunctionsService])
], DeviceFunctionsController);
