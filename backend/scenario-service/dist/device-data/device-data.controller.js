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
exports.DeviceDataController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const device_data_service_1 = require("./device-data.service");
const device_data_response_dto_1 = require("./dto/device-data-response.dto");
const device_data_schema_1 = require("./schemas/device-data.schema");
const id_params_1 = require("../common/schemas/id-params");
const enums_1 = require("../common/schemas/enums");
let DeviceDataController = class DeviceDataController {
    service;
    constructor(service) {
        this.service = service;
    }
    findMany(query) {
        const q = device_data_schema_1.listDeviceDataQuerySchema.parse(query);
        return this.service.findMany(q);
    }
    findOne(params) {
        const { id } = id_params_1.idParamSchema.parse(params);
        return this.service.findById(id);
    }
    remove(params) {
        const { id } = id_params_1.idParamSchema.parse(params);
        return this.service.remove(id);
    }
};
exports.DeviceDataController = DeviceDataController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Список данных устройств с пагинацией и фильтрами' }),
    (0, swagger_1.ApiQuery)({
        name: 'deviceId',
        required: false,
        description: 'ObjectId физического устройства',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'capability',
        required: false,
        description: 'Капабилити (например: temperature_sensor, switch, battery)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'attribute',
        required: false,
        description: 'Атрибут капабилити (например: state, value)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'type',
        required: false,
        enum: enums_1.DeviceDataType,
        description: 'Тип данных',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'from',
        required: false,
        description: 'Начало периода (ISO 8601)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'to',
        required: false,
        description: 'Конец периода (ISO 8601)',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'page',
        required: false,
        type: Number,
        description: 'Номер страницы',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Размер страницы (макс. 100)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Список записей и общее количество',
        type: device_data_response_dto_1.DeviceDataListResponseDto,
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DeviceDataController.prototype, "findMany", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить запись данных устройства по ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ObjectId записи' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Запись найдена',
        type: device_data_response_dto_1.DeviceDataResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Запись не найдена' }),
    __param(0, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DeviceDataController.prototype, "findOne", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Удалить запись данных устройства' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ObjectId записи' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Запись удалена',
        type: device_data_response_dto_1.DeviceDataResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Запись не найдена' }),
    __param(0, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DeviceDataController.prototype, "remove", null);
exports.DeviceDataController = DeviceDataController = __decorate([
    (0, swagger_1.ApiTags)('Device Data'),
    (0, common_1.Controller)('device-data'),
    __metadata("design:paramtypes", [device_data_service_1.DeviceDataService])
], DeviceDataController);
//# sourceMappingURL=device-data.controller.js.map