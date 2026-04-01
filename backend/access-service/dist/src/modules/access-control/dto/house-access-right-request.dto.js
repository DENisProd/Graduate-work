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
exports.HouseAccessRightRequestDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const UUID_EX = '550e8400-e29b-41d4-a716-446655440000';
class HouseAccessRightRequestDto {
}
exports.HouseAccessRightRequestDto = HouseAccessRightRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ format: 'uuid', example: UUID_EX, description: 'ID ресурса (устройство, комната и т.д.)' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'ID ресурса обязателен' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], HouseAccessRightRequestDto.prototype, "resourceId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ format: 'uuid', example: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], HouseAccessRightRequestDto.prototype, "houseMemberId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ format: 'uuid', example: '7ba7b810-9dad-11d1-80b4-00c04fd430c8' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], HouseAccessRightRequestDto.prototype, "houseRoleId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['ALLOW', 'DENY', 'READ', 'WRITE'], example: 'ALLOW' }),
    (0, class_validator_1.IsEnum)(['ALLOW', 'DENY', 'READ', 'WRITE'], { message: 'Тип права доступа обязателен' }),
    __metadata("design:type", String)
], HouseAccessRightRequestDto.prototype, "accessRightType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], HouseAccessRightRequestDto.prototype, "parameters", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], HouseAccessRightRequestDto.prototype, "expiresAt", void 0);
