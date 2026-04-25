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
exports.EnsureCatalogResponseDto = exports.CatalogEnsureCreatedFlagsDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class CatalogEnsureCreatedFlagsDto {
}
exports.CatalogEnsureCreatedFlagsDto = CatalogEnsureCreatedFlagsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'true, если категория была создана в этом вызове' }),
    __metadata("design:type", Boolean)
], CatalogEnsureCreatedFlagsDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'true, если устройство было создано в этом вызове' }),
    __metadata("design:type", Boolean)
], CatalogEnsureCreatedFlagsDto.prototype, "device", void 0);
class EnsureCatalogResponseDto {
}
exports.EnsureCatalogResponseDto = EnsureCatalogResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], EnsureCatalogResponseDto.prototype, "deviceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], EnsureCatalogResponseDto.prototype, "deviceCategoryId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: CatalogEnsureCreatedFlagsDto }),
    __metadata("design:type", CatalogEnsureCreatedFlagsDto)
], EnsureCatalogResponseDto.prototype, "created", void 0);
