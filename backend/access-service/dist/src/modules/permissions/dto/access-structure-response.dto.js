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
exports.AccessStructureResponseDto = exports.HouseStructureDto = exports.RoomNodeDto = exports.DeviceNodeDto = exports.DeviceFunctionNodeDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class DeviceFunctionNodeDto {
}
exports.DeviceFunctionNodeDto = DeviceFunctionNodeDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], DeviceFunctionNodeDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], DeviceFunctionNodeDto.prototype, "externalId", void 0);
class DeviceNodeDto {
}
exports.DeviceNodeDto = DeviceNodeDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], DeviceNodeDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], DeviceNodeDto.prototype, "externalId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [DeviceFunctionNodeDto] }),
    __metadata("design:type", Array)
], DeviceNodeDto.prototype, "functions", void 0);
class RoomNodeDto {
}
exports.RoomNodeDto = RoomNodeDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], RoomNodeDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Название комнаты' }),
    __metadata("design:type", String)
], RoomNodeDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], RoomNodeDto.prototype, "externalId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [DeviceNodeDto] }),
    __metadata("design:type", Array)
], RoomNodeDto.prototype, "devices", void 0);
class HouseStructureDto {
}
exports.HouseStructureDto = HouseStructureDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], HouseStructureDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], HouseStructureDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [RoomNodeDto] }),
    __metadata("design:type", Array)
], HouseStructureDto.prototype, "rooms", void 0);
class AccessStructureResponseDto {
}
exports.AccessStructureResponseDto = AccessStructureResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [HouseStructureDto] }),
    __metadata("design:type", Array)
], AccessStructureResponseDto.prototype, "houses", void 0);
