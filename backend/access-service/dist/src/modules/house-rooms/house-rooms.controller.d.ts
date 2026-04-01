import { HouseRoomsService } from './house-rooms.service';
import { HouseRoomRequestDto } from './dto/house-room-request.dto';
import { HouseRoomResponseDto } from './dto/house-room-response.dto';
export declare class HouseRoomsController {
    private readonly houseRoomsService;
    constructor(houseRoomsService: HouseRoomsService);
    findByHouseId(houseId: string): Promise<HouseRoomResponseDto[]>;
    findById(id: string): Promise<HouseRoomResponseDto>;
    create(dto: HouseRoomRequestDto): Promise<HouseRoomResponseDto>;
    update(id: string, dto: HouseRoomRequestDto): Promise<HouseRoomResponseDto>;
    delete(id: string): Promise<void>;
}
