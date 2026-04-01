import { HouseResponseDto } from './dto/house-response.dto';
import { PageResponseDto } from '../common/dto/page-response.dto';
import { House, User } from '@prisma/client';
type HouseWithOwner = House & {
    owner: User;
};
export declare function toHouseResponse(h: HouseWithOwner): HouseResponseDto;
export declare function toHousePageResponse(content: HouseWithOwner[], page: number, size: number, total: number): PageResponseDto<HouseResponseDto>;
export {};
