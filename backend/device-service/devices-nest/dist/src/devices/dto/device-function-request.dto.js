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
exports.DeviceFunctionRequest = exports.DeviceFunctionTranslationRequest = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
class DeviceFunctionTranslationRequest {
}
exports.DeviceFunctionTranslationRequest = DeviceFunctionTranslationRequest;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DeviceFunctionTranslationRequest.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], DeviceFunctionTranslationRequest.prototype, "description", void 0);
class DeviceFunctionRequest {
    constructor() {
        this.active = true;
    }
}
exports.DeviceFunctionRequest = DeviceFunctionRequest;
__decorate([
    (0, swagger_1.ApiProperty)({ pattern: '^[a-z][a-z0-9_]*$', example: 'temperature' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    (0, class_validator_1.Matches)(/^[a-z][a-z0-9_]*$/),
    __metadata("design:type", String)
], DeviceFunctionRequest.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], DeviceFunctionRequest.prototype, "deviceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.DeviceFunctionType }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEnum)(client_1.DeviceFunctionType),
    __metadata("design:type", String)
], DeviceFunctionRequest.prototype, "functionType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], DeviceFunctionRequest.prototype, "currentValue", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Object)
], DeviceFunctionRequest.prototype, "minValue", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Object)
], DeviceFunctionRequest.prototype, "maxValue", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ maxLength: 50 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", Object)
], DeviceFunctionRequest.prototype, "unit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], DeviceFunctionRequest.prototype, "active", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Переводы по коду локали',
        example: { en: { name: 'Temperature' } },
    }),
    (0, class_validator_1.IsNotEmptyObject)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => DeviceFunctionTranslationRequest),
    __metadata("design:type", Object)
], DeviceFunctionRequest.prototype, "translations", void 0);
