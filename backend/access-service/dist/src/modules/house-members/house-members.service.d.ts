import { PrismaService } from '../../prisma/prisma.service';
import { UserService } from '../../users/users.service';
import { HousesService } from '../houses/houses.service';
import { HouseMember, User, House, HouseMemberRole, HouseRole, HousePermission, EffectivePermission, Resource } from '@prisma/client';
import { HouseRolesService } from '../house-roles/house-roles.service';
import { RightWithRelations } from '../access-control/access-control.mapper';
export type MemberWithUserAndHouse = HouseMember & {
    user: User;
    house: House;
    roles: (HouseMemberRole & {
        role: HouseRole & {
            permissions: {
                permission: HousePermission;
            }[];
        };
    })[];
};
export type MemberWithAccessDetails = {
    member: MemberWithUserAndHouse;
    effective: (EffectivePermission & {
        resource: Resource;
    })[];
    directRights: RightWithRelations[];
};
export declare class HouseMembersService {
    private readonly prisma;
    private readonly userService;
    private readonly housesService;
    private readonly houseRolesService;
    constructor(prisma: PrismaService, userService: UserService, housesService: HousesService, houseRolesService: HouseRolesService);
    findById(id: string): Promise<MemberWithUserAndHouse>;
    findByIdWithAccessDetails(id: string): Promise<MemberWithAccessDetails>;
    findByUserIdAndHouseId(userId: string, houseId: string): Promise<MemberWithUserAndHouse>;
    isMember(userId: string, houseId: string): Promise<boolean>;
    findByHouseId(houseId: string, page: number, size: number, sort: string): Promise<{
        content: MemberWithUserAndHouse[];
        total: number;
    }>;
    addMember(houseId: string, userId: string): Promise<MemberWithUserAndHouse>;
    addMemberFromInvitation(houseId: string, userId: string, invite: {
        roleId?: string | null;
        invitedPermissions?: HousePermission[];
    }): Promise<MemberWithUserAndHouse>;
    removeMember(houseId: string, userId: string): Promise<void>;
    findHousesByUserId(userId: string, page: number, size: number, sort: string): Promise<{
        content: any[];
        total: number;
    }>;
}
