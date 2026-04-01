import { HouseMemberRole, HousePermission, HouseRole } from '@prisma/client';
import { HouseMemberDetailResponseDto, HouseMemberListItemDto, HouseMemberResponseDto } from './dto/house-member-response.dto';
import type { MemberWithAccessDetails } from './house-members.service';
type MemberWithUserAndHouseMapper = {
    id: string;
    houseId: string;
    joinedAt: Date;
    user: {
        externalUserId: string;
        avatarUrl: string | null;
    };
    house: {
        id: string;
        name: string;
    };
    roles: (HouseMemberRole & {
        assignedAt: Date;
        role: HouseRole & {
            permissions: {
                permission: HousePermission;
            }[];
        };
    })[];
};
export declare function toHouseMemberListItemResponse(m: MemberWithUserAndHouseMapper): HouseMemberListItemDto;
export declare function toHouseMemberResponse(m: MemberWithUserAndHouseMapper): HouseMemberResponseDto;
export declare function toHouseMemberDetailResponse(data: MemberWithAccessDetails): HouseMemberDetailResponseDto;
export {};
