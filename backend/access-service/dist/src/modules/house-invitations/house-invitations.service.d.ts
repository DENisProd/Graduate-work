import { PrismaService } from '../../prisma/prisma.service';
import { HousesService } from '../houses/houses.service';
import { HouseMembersService } from '../house-members/house-members.service';
import { HouseRolesService } from '../house-roles/house-roles.service';
import { HouseInvitationRequestDto } from './dto/house-invitation-request.dto';
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
export declare class HouseInvitationsService {
    private readonly prisma;
    private readonly housesService;
    private readonly houseMembersService;
    private readonly houseRolesService;
    constructor(prisma: PrismaService, housesService: HousesService, houseMembersService: HouseMembersService, houseRolesService: HouseRolesService);
    create(dto: HouseInvitationRequestDto, invitedByUserId: string): Promise<InvitationWithRelations>;
    findByToken(token: string): Promise<InvitationWithRelations>;
    findById(id: string): Promise<InvitationWithRelations>;
    findByHouseId(houseId: string, page: number, size: number, sort: string, includeAll?: boolean): Promise<{
        content: InvitationWithRelations[];
        total: number;
    }>;
    accept(token: string, userId: string): Promise<InvitationWithRelations>;
    decline(token: string): Promise<InvitationWithRelations>;
    revoke(id: string, userId: string): Promise<InvitationWithRelations>;
    cleanupExpired(): Promise<void>;
}
export {};
