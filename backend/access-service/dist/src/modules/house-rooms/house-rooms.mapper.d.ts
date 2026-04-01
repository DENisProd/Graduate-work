import { HouseRoomResponseDto } from './dto/house-room-response.dto';
import { Resource, House } from '@prisma/client';
type RoomWithHouse = Resource & {
    house: House;
};
export declare function toHouseRoomResponse(r: RoomWithHouse): HouseRoomResponseDto;
export declare function toHouseRoomResponseList(list: RoomWithHouse[]): HouseRoomResponseDto[];
export {};
