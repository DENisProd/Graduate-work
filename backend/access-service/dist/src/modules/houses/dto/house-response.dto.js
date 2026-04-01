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
exports.HouseResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const UUID_EX = '550e8400-e29b-41d4-a716-446655440000';
class HouseResponseDto {
}
exports.HouseResponseDto = HouseResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ format: 'uuid', example: UUID_EX }),
    __metadata("design:type", String)
], HouseResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Загородный дом' }),
    __metadata("design:type", String)
], HouseResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ format: 'uuid', example: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' }),
    __metadata("design:type", String)
], HouseResponseDto.prototype, "ownerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], HouseResponseDto.prototype, "ownerAvatarUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], HouseResponseDto.prototype, "avatarUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], HouseResponseDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-01 12:00:00' }),
    __metadata("design:type", String)
], HouseResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-01 12:00:00' }),
    __metadata("design:type", String)
], HouseResponseDto.prototype, "updatedAt", void 0);
