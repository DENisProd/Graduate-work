import { PrismaService } from '../../prisma/prisma.service';
import { HousesService } from '../houses/houses.service';
import { HouseRoomRequestDto } from './dto/house-room-request.dto';
import { Resource, House } from '@prisma/client';
type RoomWithHouse = Resource & {
    house: House;
};
export declare class HouseRoomsService {
    private readonly prisma;
    private readonly housesService;
    constructor(prisma: PrismaService, housesService: HousesService);
    findById(id: string): Promise<RoomWithHouse>;
    findByHouseId(houseId: string): Promise<RoomWithHouse[]>;
    create(dto: HouseRoomRequestDto): Promise<RoomWithHouse>;
    update(id: string, dto: HouseRoomRequestDto): Promise<RoomWithHouse>;
    delete(id: string): Promise<void>;
    existsInHouse(roomId: string, houseId: string): Promise<boolean>;
}
export {};
