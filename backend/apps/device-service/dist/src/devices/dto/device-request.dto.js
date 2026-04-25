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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceRequest = exports.DeviceTranslationRequest = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const device_status_enum_1 = require("../device-status.enum");
class DeviceTranslationRequest {
}
exports.DeviceTranslationRequest = DeviceTranslationRequest;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Датчик' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DeviceTranslationRequest.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Описание' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], DeviceTranslationRequest.prototype, "description", void 0);
class DeviceRequest {
    constructor() {
        this.status = device_status_enum_1.DeviceStatus.OFFLINE;
        this.active = true;
        this.isModerated = true;
    }
}
exports.DeviceRequest = DeviceRequest;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'SENSOR_01', maxLength: 100 }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], DeviceRequest.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID категории устройства' }),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], DeviceRequest.prototype, "deviceCategoryId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: device_status_enum_1.DeviceStatus, default: device_status_enum_1.DeviceStatus.OFFLINE }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(device_status_enum_1.DeviceStatus),
    __metadata("design:type", String)
], DeviceRequest.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ maxLength: 100 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", Object)
], DeviceRequest.prototype, "serialNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ maxLength: 50 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", Object)
], DeviceRequest.prototype, "firmwareVersion", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], DeviceRequest.prototype, "active", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'По умолчанию true (проверенная вручную запись)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], DeviceRequest.prototype, "isModerated", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Переводы name/description по коду локали (например en, ru). Значения — объекты с полями name и опционально description.',
        example: { en: { name: 'Sensor', description: 'Temperature' } },
    }),
    (0, class_validator_1.IsNotEmptyObject)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => DeviceTranslationRequest),
    __metadata("design:type", Object)
], DeviceRequest.prototype, "translations", void 0);
