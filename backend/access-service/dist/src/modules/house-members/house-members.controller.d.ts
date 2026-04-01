import { HouseMembersService } from './house-members.service';
import { HousesService } from '../houses/houses.service';
import { HouseMemberDetailResponseDto, HouseMemberListItemDto, HouseMemberResponseDto } from './dto/house-member-response.dto';
export declare class HouseMembersController {
    private readonly houseMembersService;
    private readonly housesService;
    constructor(houseMembersService: HouseMembersService, housesService: HousesService);
    findByHouseId(houseId: string, page?: string, size?: string, sort?: string): Promise<HouseMemberListItemDto[]>;
    findById(id: string): Promise<HouseMemberDetailResponseDto>;
    addMember(houseId: string, userId: string): Promise<HouseMemberResponseDto>;
    removeMember(houseId: string, userId: string): Promise<void>;
}
