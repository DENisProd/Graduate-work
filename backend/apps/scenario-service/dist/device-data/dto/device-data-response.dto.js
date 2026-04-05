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
exports.DeviceDataListResponseDto = exports.DeviceDataResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const enums_1 = require("../../common/schemas/enums");
class DeviceDataResponseDto {
    id;
    deviceId;
    capability;
    attribute;
    type;
    value;
    unit;
    quality;
    timestamp;
}
exports.DeviceDataResponseDto = DeviceDataResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], DeviceDataResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], DeviceDataResponseDto.prototype, "deviceId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], DeviceDataResponseDto.prototype, "capability", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, nullable: true }),
    __metadata("design:type", Object)
], DeviceDataResponseDto.prototype, "attribute", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.DeviceDataType }),
    __metadata("design:type", String)
], DeviceDataResponseDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: Object }),
    __metadata("design:type", Object)
], DeviceDataResponseDto.prototype, "value", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, nullable: true }),
    __metadata("design:type", Object)
], DeviceDataResponseDto.prototype, "unit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, nullable: true }),
    __metadata("design:type", Object)
], DeviceDataResponseDto.prototype, "quality", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], DeviceDataResponseDto.prototype, "timestamp", void 0);
class DeviceDataListResponseDto {
    items;
    total;
}
exports.DeviceDataListResponseDto = DeviceDataListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [DeviceDataResponseDto] }),
    __metadata("design:type", Array)
], DeviceDataListResponseDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], DeviceDataListResponseDto.prototype, "total", void 0);
//# sourceMappingURL=device-data-response.dto.js.map