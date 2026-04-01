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
exports.HouseRoomRequestDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const UUID_EX = '550e8400-e29b-41d4-a716-446655440000';
class HouseRoomRequestDto {
}
exports.HouseRoomRequestDto = HouseRoomRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Гостиная' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Название комнаты не может быть пустым' }),
    (0, class_validator_1.MaxLength)(255, { message: 'Название комнаты не может быть длиннее 255 символов' }),
    __metadata("design:type", String)
], HouseRoomRequestDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ format: 'uuid', example: UUID_EX }),
    (0, class_validator_1.IsNotEmpty)({ message: 'ID дома обязателен' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], HouseRoomRequestDto.prototype, "houseId", void 0);
