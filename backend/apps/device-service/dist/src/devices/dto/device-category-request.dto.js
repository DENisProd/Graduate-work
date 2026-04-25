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
exports.DeviceCategoryRequest = exports.DeviceCategoryTranslationRequest = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class DeviceCategoryTranslationRequest {
}
exports.DeviceCategoryTranslationRequest = DeviceCategoryTranslationRequest;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DeviceCategoryTranslationRequest.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], DeviceCategoryTranslationRequest.prototype, "description", void 0);
class DeviceCategoryRequest {
    constructor() {
        this.active = true;
        this.isModerated = true;
    }
}
exports.DeviceCategoryRequest = DeviceCategoryRequest;
__decorate([
    (0, swagger_1.ApiProperty)({ pattern: '^[A-Z][A-Z0-9_]*$', example: 'TEMP_SENSOR' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    (0, class_validator_1.Matches)(/^[A-Z][A-Z0-9_]*$/),
    __metadata("design:type", String)
], DeviceCategoryRequest.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID типа устройства' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], DeviceCategoryRequest.prototype, "deviceTypeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], DeviceCategoryRequest.prototype, "active", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'По умолчанию true (проверенная вручную запись)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], DeviceCategoryRequest.prototype, "isModerated", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Переводы по коду локали',
        example: { en: { name: 'Temperature sensor' } },
    }),
    (0, class_validator_1.IsNotEmptyObject)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => DeviceCategoryTranslationRequest),
    __metadata("design:type", Object)
], DeviceCategoryRequest.prototype, "translations", void 0);
