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
exports.AccessCheckResponseDto = exports.AccessRightDetailDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const UUID_EX = '550e8400-e29b-41d4-a716-446655440000';
class AccessRightDetailDto {
}
exports.AccessRightDetailDto = AccessRightDetailDto;
__decorate([
    (0, swagger_1.ApiProperty)({ format: 'uuid', example: UUID_EX }),
    __metadata("design:type", String)
], AccessRightDetailDto.prototype, "rightId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['ALLOW', 'DENY', 'READ', 'WRITE'], example: 'ALLOW' }),
    __metadata("design:type", String)
], AccessRightDetailDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ format: 'uuid', example: UUID_EX }),
    __metadata("design:type", String)
], AccessRightDetailDto.prototype, "deviceId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ format: 'uuid' }),
    __metadata("design:type", String)
], AccessRightDetailDto.prototype, "deviceFunctionId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ format: 'uuid' }),
    __metadata("design:type", String)
], AccessRightDetailDto.prototype, "houseRoomId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false }),
    __metadata("design:type", Boolean)
], AccessRightDetailDto.prototype, "isExpired", void 0);
class AccessCheckResponseDto {
}
exports.AccessCheckResponseDto = AccessCheckResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], AccessCheckResponseDto.prototype, "hasAccess", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['ALLOW', 'DENY', 'READ', 'WRITE'], example: 'ALLOW' }),
    __metadata("design:type", String)
], AccessCheckResponseDto.prototype, "effectiveRightType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [AccessRightDetailDto] }),
    __metadata("design:type", Array)
], AccessCheckResponseDto.prototype, "applicableRights", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Доступ разрешён правом ALLOW' }),
    __metadata("design:type", String)
], AccessCheckResponseDto.prototype, "reason", void 0);
