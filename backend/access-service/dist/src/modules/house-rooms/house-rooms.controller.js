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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HouseRoomsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const house_rooms_service_1 = require("./house-rooms.service");
const house_room_request_dto_1 = require("./dto/house-room-request.dto");
const house_room_response_dto_1 = require("./dto/house-room-response.dto");
const house_rooms_mapper_1 = require("./house-rooms.mapper");
let HouseRoomsController = class HouseRoomsController {
    constructor(houseRoomsService) {
        this.houseRoomsService = houseRoomsService;
    }
    async findByHouseId(houseId) {
        const rooms = await this.houseRoomsService.findByHouseId(houseId);
        return (0, house_rooms_mapper_1.toHouseRoomResponseList)(rooms);
    }
    async findById(id) {
        const room = await this.houseRoomsService.findById(id);
        return (0, house_rooms_mapper_1.toHouseRoomResponse)(room);
    }
    async create(dto) {
        const room = await this.houseRoomsService.create(dto);
        return (0, house_rooms_mapper_1.toHouseRoomResponse)(room);
    }
    async update(id, dto) {
        const room = await this.houseRoomsService.update(id, dto);
        return (0, house_rooms_mapper_1.toHouseRoomResponse)(room);
    }
    async delete(id) {
        await this.houseRoomsService.delete(id);
    }
};
exports.HouseRoomsController = HouseRoomsController;
__decorate([
    (0, common_1.Get)('house/:houseId'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить все комнаты дома' }),
    (0, swagger_1.ApiParam)({ name: 'houseId', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' }),
    (0, swagger_1.ApiOkResponse)({ type: house_room_response_dto_1.HouseRoomResponseDto, isArray: true }),
    __param(0, (0, common_1.Param)('houseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HouseRoomsController.prototype, "findByHouseId", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Получить комнату по ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' }),
    (0, swagger_1.ApiOkResponse)({ type: house_room_response_dto_1.HouseRoomResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HouseRoomsController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Создать комнату' }),
    (0, swagger_1.ApiCreatedResponse)({ type: house_room_response_dto_1.HouseRoomResponseDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [house_room_request_dto_1.HouseRoomRequestDto]),
    __metadata("design:returntype", Promise)
], HouseRoomsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Обновить комнату' }),
    (0, swagger_1.ApiParam)({ name: 'id', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' }),
    (0, swagger_1.ApiOkResponse)({ type: house_room_response_dto_1.HouseRoomResponseDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, house_room_request_dto_1.HouseRoomRequestDto]),
    __metadata("design:returntype", Promise)
], HouseRoomsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Удалить комнату' }),
    (0, swagger_1.ApiParam)({ name: 'id', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' }),
    (0, swagger_1.ApiNoContentResponse)({ description: 'Комната удалена' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HouseRoomsController.prototype, "delete", null);
exports.HouseRoomsController = HouseRoomsController = __decorate([
    (0, swagger_1.ApiTags)('House Rooms'),
    (0, common_1.Controller)('house-rooms'),
    __metadata("design:paramtypes", [house_rooms_service_1.HouseRoomsService])
], HouseRoomsController);
