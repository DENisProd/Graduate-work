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
exports.DevicesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const devices_service_1 = require("./devices.service");
const device_status_enum_1 = require("./device-status.enum");
const device_request_dto_1 = require("./dto/device-request.dto");
const page_response_dto_1 = require("./dto/page-response.dto");
let DevicesController = class DevicesController {
    constructor(devicesService) {
        this.devicesService = devicesService;
    }
    findAll(page = 0, size = 20) {
        const p = Number(page) || 0;
        const s = Number(size) || 20;
        return this.devicesService.findAll(p, s);
    }
    findByCategoryId(categoryId, page = 0, size = 20) {
        const p = Number(page) || 0;
        const s = Number(size) || 20;
        const id = Number(categoryId);
        return this.devicesService.findByCategoryId(id, p, s);
    }
    findByIdDetailed(id) {
        return this.devicesService.findByIdDetailed(Number(id));
    }
    findByCode(code) {
        return this.devicesService.findByCode(code);
    }
    findById(id) {
        return this.devicesService.findById(Number(id));
    }
    updateStatus(id, status) {
        return this.devicesService.updateStatus(Number(id), status);
    }
    create(body) {
        return this.devicesService.create(body);
    }
    update(id, body) {
        return this.devicesService.update(Number(id), body);
    }
    softDelete(id) {
        return this.devicesService.delete(Number(id));
    }
};
exports.DevicesController = DevicesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Список устройств (постранично)' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, example: 0, description: 'Номер страницы (с 0)' }),
    (0, swagger_1.ApiQuery)({ name: 'size', required: false, example: 20, description: 'Размер страницы' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Страница устройств', type: page_response_dto_1.PageResponse }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('size')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('by-category/:categoryId'),
    (0, swagger_1.ApiOperation)({ summary: 'Устройства по категории' }),
    (0, swagger_1.ApiParam)({ name: 'categoryId', description: 'ID категории' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, example: 0 }),
    (0, swagger_1.ApiQuery)({ name: 'size', required: false, example: 20 }),
    (0, swagger_1.ApiOkResponse)({ description: 'Страница устройств', type: page_response_dto_1.PageResponse }),
    __param(0, (0, common_1.Param)('categoryId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('size')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "findByCategoryId", null);
__decorate([
    (0, common_1.Get)(':id/detailed'),
    (0, swagger_1.ApiOperation)({ summary: 'Устройство по ID (детально, с вложениями)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID устройства' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Устройство' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "findByIdDetailed", null);
__decorate([
    (0, common_1.Get)('code/:code'),
    (0, swagger_1.ApiOperation)({ summary: 'Устройство по коду' }),
    (0, swagger_1.ApiParam)({ name: 'code', example: 'SENSOR_01' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Устройство' }),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "findByCode", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Устройство по ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID устройства' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Устройство' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "findById", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Обновить статус устройства' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID устройства' }),
    (0, swagger_1.ApiQuery)({ name: 'status', enum: device_status_enum_1.DeviceStatus, description: 'Новый статус' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Обновлённое устройство' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Создать устройство' }),
    (0, swagger_1.ApiBody)({ type: device_request_dto_1.DeviceRequest }),
    (0, swagger_1.ApiOkResponse)({ description: 'Созданное устройство' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [device_request_dto_1.DeviceRequest]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Полное обновление устройства' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID устройства' }),
    (0, swagger_1.ApiBody)({ type: device_request_dto_1.DeviceRequest }),
    (0, swagger_1.ApiOkResponse)({ description: 'Обновлённое устройство' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, device_request_dto_1.DeviceRequest]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Мягкое удаление устройства (деактивация)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID устройства' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Тело ответа пустое' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "softDelete", null);
exports.DevicesController = DevicesController = __decorate([
    (0, swagger_1.ApiTags)('Devices'),
    (0, common_1.Controller)('api/v1/devices'),
    __metadata("design:paramtypes", [devices_service_1.DevicesService])
], DevicesController);
