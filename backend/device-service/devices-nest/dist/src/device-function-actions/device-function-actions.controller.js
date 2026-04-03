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
exports.DeviceFunctionActionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const device_function_actions_service_1 = require("./device-function-actions.service");
const page_response_dto_1 = require("../devices/dto/page-response.dto");
let DeviceFunctionActionsController = class DeviceFunctionActionsController {
    constructor(service) {
        this.service = service;
    }
    findAllByFunctionId(functionId) {
        return this.service.findByFunctionId(Number(functionId));
    }
    findByFunctionId(functionId, page = 0, size = 20) {
        const p = Number(page) || 0;
        const s = Number(size) || 20;
        return this.service.findByFunctionIdPaged(Number(functionId), p, s);
    }
    findAllByDeviceId(deviceId) {
        return this.service.findByDeviceId(Number(deviceId));
    }
    findByDeviceId(deviceId, page = 0, size = 20) {
        const p = Number(page) || 0;
        const s = Number(size) || 20;
        return this.service.findByDeviceIdPaged(Number(deviceId), p, s);
    }
    findById(id) {
        return this.service.findById(Number(id));
    }
    execute(id) {
        return this.service.execute(Number(id));
    }
};
exports.DeviceFunctionActionsController = DeviceFunctionActionsController;
__decorate([
    (0, common_1.Get)('by-function/:functionId/all'),
    (0, swagger_1.ApiOperation)({ summary: 'Все действия функции' }),
    (0, swagger_1.ApiParam)({ name: 'functionId', description: 'ID функции устройства' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Массив действий' }),
    __param(0, (0, common_1.Param)('functionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DeviceFunctionActionsController.prototype, "findAllByFunctionId", null);
__decorate([
    (0, common_1.Get)('by-function/:functionId'),
    (0, swagger_1.ApiOperation)({ summary: 'Действия функции (постранично)' }),
    (0, swagger_1.ApiParam)({ name: 'functionId', description: 'ID функции устройства' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, example: 0 }),
    (0, swagger_1.ApiQuery)({ name: 'size', required: false, example: 20 }),
    (0, swagger_1.ApiOkResponse)({ description: 'Страница действий', type: page_response_dto_1.PageResponse }),
    __param(0, (0, common_1.Param)('functionId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('size')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], DeviceFunctionActionsController.prototype, "findByFunctionId", null);
__decorate([
    (0, common_1.Get)('by-device/:deviceId/all'),
    (0, swagger_1.ApiOperation)({ summary: 'Все действия по устройству' }),
    (0, swagger_1.ApiParam)({ name: 'deviceId', description: 'ID устройства' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Массив действий' }),
    __param(0, (0, common_1.Param)('deviceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DeviceFunctionActionsController.prototype, "findAllByDeviceId", null);
__decorate([
    (0, common_1.Get)('by-device/:deviceId'),
    (0, swagger_1.ApiOperation)({ summary: 'Действия по устройству (постранично)' }),
    (0, swagger_1.ApiParam)({ name: 'deviceId', description: 'ID устройства' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, example: 0 }),
    (0, swagger_1.ApiQuery)({ name: 'size', required: false, example: 20 }),
    (0, swagger_1.ApiOkResponse)({ description: 'Страница действий', type: page_response_dto_1.PageResponse }),
    __param(0, (0, common_1.Param)('deviceId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('size')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], DeviceFunctionActionsController.prototype, "findByDeviceId", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Действие по ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID действия' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Действие' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DeviceFunctionActionsController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(':id/execute'),
    (0, swagger_1.ApiOperation)({ summary: 'Выполнить действие' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID действия' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Действие после выполнения' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DeviceFunctionActionsController.prototype, "execute", null);
exports.DeviceFunctionActionsController = DeviceFunctionActionsController = __decorate([
    (0, swagger_1.ApiTags)('Device function actions'),
    (0, common_1.Controller)('api/v1/device-function-actions'),
    __metadata("design:paramtypes", [device_function_actions_service_1.DeviceFunctionActionsService])
], DeviceFunctionActionsController);
