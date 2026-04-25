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
exports.EnsureCatalogRequestDto = exports.EnsureCatalogTranslationsDto = exports.CatalogTranslationItemDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class CatalogTranslationItemDto {
}
exports.CatalogTranslationItemDto = CatalogTranslationItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Temperature sensor' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CatalogTranslationItemDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Measures ambient temperature' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], CatalogTranslationItemDto.prototype, "description", void 0);
class EnsureCatalogTranslationsDto {
}
exports.EnsureCatalogTranslationsDto = EnsureCatalogTranslationsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Переводы для типа (локаль -> name). Если нет — имя строится из `deviceTypeCode`.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], EnsureCatalogTranslationsDto.prototype, "deviceType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Переводы для категории.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], EnsureCatalogTranslationsDto.prototype, "deviceCategory", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Переводы для устройства.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], EnsureCatalogTranslationsDto.prototype, "device", void 0);
class EnsureCatalogRequestDto {
}
exports.EnsureCatalogRequestDto = EnsureCatalogRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Код типа в UPPER_SNAKE_CASE', example: 'ZIGBEE' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    (0, class_validator_1.Matches)(/^[A-Z][A-Z0-9_]*$/),
    __metadata("design:type", String)
], EnsureCatalogRequestDto.prototype, "deviceTypeCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Код категории в UPPER_SNAKE_CASE', example: 'TEMP_SENSOR' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    (0, class_validator_1.Matches)(/^[A-Z][A-Z0-9_]*$/),
    __metadata("design:type", String)
], EnsureCatalogRequestDto.prototype, "deviceCategoryCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Стабильный ключ устройства (unique в каталоге), max 100', example: '0x1234567890abcdef' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], EnsureCatalogRequestDto.prototype, "deviceCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: EnsureCatalogTranslationsDto }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => EnsureCatalogTranslationsDto),
    __metadata("design:type", EnsureCatalogTranslationsDto)
], EnsureCatalogRequestDto.prototype, "translations", void 0);
