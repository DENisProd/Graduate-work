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
exports.HouseAccessRightResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class HouseAccessRightResponseDto {
}
exports.HouseAccessRightResponseDto = HouseAccessRightResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ format: 'uuid' }),
    __metadata("design:type", String)
], HouseAccessRightResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ format: 'uuid' }),
    __metadata("design:type", String)
], HouseAccessRightResponseDto.prototype, "houseId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], HouseAccessRightResponseDto.prototype, "houseName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ format: 'uuid' }),
    __metadata("design:type", String)
], HouseAccessRightResponseDto.prototype, "houseMemberId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ format: 'uuid' }),
    __metadata("design:type", String)
], HouseAccessRightResponseDto.prototype, "houseRoleId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], HouseAccessRightResponseDto.prototype, "houseRoleName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ format: 'uuid' }),
    __metadata("design:type", String)
], HouseAccessRightResponseDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], HouseAccessRightResponseDto.prototype, "userName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ format: 'uuid' }),
    __metadata("design:type", String)
], HouseAccessRightResponseDto.prototype, "deviceId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ format: 'uuid' }),
    __metadata("design:type", String)
], HouseAccessRightResponseDto.prototype, "deviceFunctionId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ format: 'uuid' }),
    __metadata("design:type", String)
], HouseAccessRightResponseDto.prototype, "houseRoomId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], HouseAccessRightResponseDto.prototype, "houseRoomName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['ALLOW', 'DENY', 'READ', 'WRITE'] }),
    __metadata("design:type", String)
], HouseAccessRightResponseDto.prototype, "accessRightType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], HouseAccessRightResponseDto.prototype, "parameters", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-01 12:00:00' }),
    __metadata("design:type", String)
], HouseAccessRightResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ format: 'uuid' }),
    __metadata("design:type", String)
], HouseAccessRightResponseDto.prototype, "grantedById", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], HouseAccessRightResponseDto.prototype, "grantedByName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-01-01 12:00:00' }),
    __metadata("design:type", String)
], HouseAccessRightResponseDto.prototype, "expiresAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], HouseAccessRightResponseDto.prototype, "isExpired", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], HouseAccessRightResponseDto.prototype, "isActive", void 0);
