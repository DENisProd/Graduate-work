import { HouseRoomResponseDto } from './dto/house-room-response.dto';
import { Resource, House } from '@prisma/client';

type RoomWithHouse = Resource & { house: House };

const formatDate = (d: Date): string => new Date(d).toISOString().replace('T', ' ').slice(0, 19);

export function toHouseRoomResponse(r: RoomWithHouse): HouseRoomResponseDto {
  return {
    id: r.id,
    name: r.name ?? '',
    houseId: r.house.id,
    houseName: r.house.name,
    createdAt: formatDate(r.createdAt),
  };
}

export function toHouseRoomResponseList(list: RoomWithHouse[]): HouseRoomResponseDto[] {
  return list.map(toHouseRoomResponse);
}
