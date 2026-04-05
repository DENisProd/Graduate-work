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
exports.AdminDeviceTypesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const device_types_service_1 = require("../device-types/device-types.service");
const device_type_request_dto_1 = require("../devices/dto/device-type-request.dto");
let AdminDeviceTypesController = class AdminDeviceTypesController {
    constructor(service) {
        this.service = service;
    }
    findAll() {
        return this.service.findAllFull();
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
exports.AdminDeviceTypesController = AdminDeviceTypesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Все типы устройств (админ, полные сущности)' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Массив типов' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminDeviceTypesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('code/:code'),
    (0, swagger_1.ApiOperation)({ summary: 'Тип по коду (админ)' }),
    (0, swagger_1.ApiParam)({ name: 'code', example: 'SENSOR' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Тип устройства' }),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminDeviceTypesController.prototype, "findByCode", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Тип по ID (админ)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID типа' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Тип устройства' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminDeviceTypesController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Создать тип устройства' }),
    (0, swagger_1.ApiBody)({ type: device_type_request_dto_1.DeviceTypeRequest }),
    (0, swagger_1.ApiOkResponse)({ description: 'Созданный тип' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [device_type_request_dto_1.DeviceTypeRequest]),
    __metadata("design:returntype", Promise)
], AdminDeviceTypesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Обновить тип устройства' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID типа' }),
    (0, swagger_1.ApiBody)({ type: device_type_request_dto_1.DeviceTypeRequest }),
    (0, swagger_1.ApiOkResponse)({ description: 'Обновлённый тип' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, device_type_request_dto_1.DeviceTypeRequest]),
    __metadata("design:returntype", Promise)
], AdminDeviceTypesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Удалить тип устройства' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID типа' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Удалено' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminDeviceTypesController.prototype, "delete", null);
exports.AdminDeviceTypesController = AdminDeviceTypesController = __decorate([
    (0, swagger_1.ApiTags)('Admin — device types'),
    (0, common_1.Controller)('api/v1/admin/device-types'),
    __metadata("design:paramtypes", [device_types_service_1.DeviceTypesService])
], AdminDeviceTypesController);
