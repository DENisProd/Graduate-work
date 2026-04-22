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
exports.PhysicalDeviceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const physical_device_service_1 = require("./physical-device.service");
const create_physical_device_dto_1 = require("./dto/create-physical-device.dto");
const update_physical_device_dto_1 = require("./dto/update-physical-device.dto");
const physical_device_response_dto_1 = require("./dto/physical-device-response.dto");
const physical_device_schema_1 = require("./schemas/physical-device.schema");
const id_params_1 = require("../common/schemas/id-params");
let PhysicalDeviceController = class PhysicalDeviceController {
    service;
    constructor(service) {
        this.service = service;
    }
    create(dto) {
        return this.service.create(dto);
    }
    findMany(query) {
        const q = physical_device_schema_1.listPhysicalDevicesQuerySchema.parse(query);
        return this.service.findMany(q);
    }
    findOne(params) {
        const { id } = id_params_1.idParamSchema.parse(params);
        return this.service.findById(id);
    }
    update(params, dto) {
        const { id } = id_params_1.idParamSchema.parse(params);
        return this.service.update(id, dto);
    }
    remove(params) {
        const { id } = id_params_1.idParamSchema.parse(params);
        return this.service.remove(id);
    }
};
exports.PhysicalDeviceController = PhysicalDeviceController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Создать физическое устройство' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            required: ['name', 'houseId'],
            properties: {
                name: { type: 'string', maxLength: 255 },
                description: { type: 'string', maxLength: 1000 },
                deviceTypeId: {
                    type: 'number',
                    minimum: 1,
                    description: 'ID типа устройства из device-service. Если не указан и устройство имеет модель (model), будет определён автоматически.',
                },
                houseId: { type: 'string', maxLength: 255 },
                roomId: { type: 'string', maxLength: 255 },
                firmwareVersion: { type: 'string', maxLength: 100 },
                ipAddress: { type: 'string' },
                macAddress: { type: 'string', maxLength: 17 },
                serialNumber: { type: 'string', maxLength: 100 },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Устройство создано',
        type: physical_device_response_dto_1.PhysicalDeviceResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Ошибка валидации' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_physical_device_dto_1.CreatePhysicalDeviceDto]),
    __metadata("design:returntype", void 0)
], PhysicalDeviceController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Список устройств с пагинацией и фильтрами' }),
    (0, swagger_1.ApiQuery)({
        name: 'houseId',
        required: false,
        type: String,
        description: 'ID дома',
    }),
    (0, swagger_1.ApiQuery)({ name: 'roomId', required: false, description: 'ID комнаты' }),
    (0, swagger_1.ApiQuery)({
        name: 'page',
        required: false,
        type: Number,
        description: 'Номер страницы (по умолчанию 1)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Размер страницы (по умолчанию 20, макс. 100)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Список устройств и общее количество',
        type: physical_device_response_dto_1.PhysicalDeviceListResponseDto,
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PhysicalDeviceController.prototype, "findMany", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить устройство по ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ObjectId устройства' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Устройство найдено',
        type: physical_device_response_dto_1.PhysicalDeviceResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Устройство не найдено' }),
    __param(0, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PhysicalDeviceController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Обновить устройство' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ObjectId устройства' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                name: { type: 'string', maxLength: 255 },
                description: { type: 'string', maxLength: 1000, nullable: true },
                deviceTypeId: { type: 'number', minimum: 1 },
                houseId: { type: 'string', maxLength: 255 },
                roomId: { type: 'string', maxLength: 255, nullable: true },
                firmwareVersion: { type: 'string', maxLength: 100, nullable: true },
                ipAddress: { type: 'string', nullable: true },
                macAddress: { type: 'string', maxLength: 17, nullable: true },
                serialNumber: { type: 'string', maxLength: 100, nullable: true },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Устройство обновлено',
        type: physical_device_response_dto_1.PhysicalDeviceResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Устройство не найдено' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Ошибка валидации' }),
    __param(0, (0, common_1.Param)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_physical_device_dto_1.UpdatePhysicalDeviceDto]),
    __metadata("design:returntype", void 0)
], PhysicalDeviceController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Удалить устройство' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ObjectId устройства' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Устройство удалено',
        type: physical_device_response_dto_1.PhysicalDeviceResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Устройство не найдено' }),
    __param(0, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PhysicalDeviceController.prototype, "remove", null);
exports.PhysicalDeviceController = PhysicalDeviceController = __decorate([
    (0, swagger_1.ApiTags)('Physical Devices'),
    (0, common_1.Controller)('physical-devices'),
    __metadata("design:paramtypes", [physical_device_service_1.PhysicalDeviceService])
], PhysicalDeviceController);
//# sourceMappingURL=physical-device.controller.js.map