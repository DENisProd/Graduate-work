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
exports.HouseRequestDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const UUID_EX = '550e8400-e29b-41d4-a716-446655440000';
class HouseRequestDto {
}
exports.HouseRequestDto = HouseRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Загородный дом', description: 'Отображаемое название' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Название дома не может быть пустым' }),
    (0, class_validator_1.MaxLength)(255, { message: 'Название дома не может быть длиннее 255 символов' }),
    __metadata("design:type", String)
], HouseRequestDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ format: 'uuid', example: UUID_EX, description: 'Внешний UUID владельца' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'ID владельца обязателен' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], HouseRequestDto.prototype, "ownerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://cdn.example/avatars/house.png' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], HouseRequestDto.prototype, "avatarUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'г. Москва, ул. Примерная, 1' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], HouseRequestDto.prototype, "address", void 0);
