import { HouseInvitationResponseDto } from './dto/house-invitation-response.dto';
import { PageResponseDto } from '../common/dto/page-response.dto';
import { HouseInvitation, House, HouseMember, User, HouseRole, HousePermission } from '@prisma/client';
type InvitationWithRelations = HouseInvitation & {
    house: House;
    invitedBy: (HouseMember & {
        user: User;
    }) | null;
    role: (HouseRole & {
        permissions: {
            permission: HousePermission;
        }[];
    }) | null;
};
export declare function toHouseInvitationResponse(i: InvitationWithRelations): HouseInvitationResponseDto;
export declare function toHouseInvitationPageResponse(content: InvitationWithRelations[], page: number, size: number, total: number): PageResponseDto<HouseInvitationResponseDto>;
export {};
