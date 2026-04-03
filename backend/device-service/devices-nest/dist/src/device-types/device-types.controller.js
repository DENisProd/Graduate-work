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
exports.DeviceTypesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const device_types_service_1 = require("./device-types.service");
let DeviceTypesController = class DeviceTypesController {
    constructor(deviceTypesService) {
        this.deviceTypesService = deviceTypesService;
    }
    findAll() {
        return this.deviceTypesService.findAll();
    }
    findByCode(code) {
        return this.deviceTypesService.findByCode(code);
    }
    findById(id) {
        return this.deviceTypesService.findById(Number(id));
    }
};
exports.DeviceTypesController = DeviceTypesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Список типов устройств' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Массив типов' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DeviceTypesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('code/:code'),
    (0, swagger_1.ApiOperation)({ summary: 'Тип устройства по коду' }),
    (0, swagger_1.ApiParam)({ name: 'code', example: 'SENSOR' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Тип устройства' }),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DeviceTypesController.prototype, "findByCode", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Тип устройства по ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID типа' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Тип устройства' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DeviceTypesController.prototype, "findById", null);
exports.DeviceTypesController = DeviceTypesController = __decorate([
    (0, swagger_1.ApiTags)('Device types'),
    (0, common_1.Controller)('api/v1/device-types'),
    __metadata("design:paramtypes", [device_types_service_1.DeviceTypesService])
], DeviceTypesController);
