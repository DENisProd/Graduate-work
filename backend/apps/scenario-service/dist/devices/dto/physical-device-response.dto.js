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
exports.PhysicalDeviceListResponseDto = exports.PhysicalDeviceResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class PhysicalDeviceResponseDto {
    id;
    name;
    description;
    deviceTypeId;
    houseId;
    roomId;
    deviceId;
    firmwareVersion;
    ipAddress;
    macAddress;
    serialNumber;
    createdAt;
    updatedAt;
}
exports.PhysicalDeviceResponseDto = PhysicalDeviceResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PhysicalDeviceResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PhysicalDeviceResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, nullable: true }),
    __metadata("design:type", Object)
], PhysicalDeviceResponseDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PhysicalDeviceResponseDto.prototype, "deviceTypeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PhysicalDeviceResponseDto.prototype, "houseId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, nullable: true }),
    __metadata("design:type", Object)
], PhysicalDeviceResponseDto.prototype, "roomId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, nullable: true }),
    __metadata("design:type", Object)
], PhysicalDeviceResponseDto.prototype, "deviceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, nullable: true }),
    __metadata("design:type", Object)
], PhysicalDeviceResponseDto.prototype, "firmwareVersion", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, nullable: true }),
    __metadata("design:type", Object)
], PhysicalDeviceResponseDto.prototype, "ipAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, nullable: true }),
    __metadata("design:type", Object)
], PhysicalDeviceResponseDto.prototype, "macAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, nullable: true }),
    __metadata("design:type", Object)
], PhysicalDeviceResponseDto.prototype, "serialNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], PhysicalDeviceResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], PhysicalDeviceResponseDto.prototype, "updatedAt", void 0);
class PhysicalDeviceListResponseDto {
    items;
    total;
}
exports.PhysicalDeviceListResponseDto = PhysicalDeviceListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [PhysicalDeviceResponseDto] }),
    __metadata("design:type", Array)
], PhysicalDeviceListResponseDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PhysicalDeviceListResponseDto.prototype, "total", void 0);
//# sourceMappingURL=physical-device-response.dto.js.map