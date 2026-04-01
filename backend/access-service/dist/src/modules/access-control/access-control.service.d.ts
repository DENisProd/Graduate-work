import { PrismaService } from '../../prisma/prisma.service';
import { HousesService } from '../houses/houses.service';
import { HouseMembersService } from '../house-members/house-members.service';
import { UserService } from '../../users/users.service';
import { HouseRolesService } from '../house-roles/house-roles.service';
import { HouseAccessRightRequestDto } from './dto/house-access-right-request.dto';
import { AccessCheckRequestDto } from './dto/access-check-request.dto';
import { AccessCheckResponseDto } from './dto/access-check-response.dto';
import { Prisma } from '@prisma/client';
type RightWithRelations = Prisma.AccessRightGetPayload<{
    include: {
        resource: {
            include: {
                house: true;
            };
        };
        houseMember: {
            include: {
                user: true;
            };
        };
        role: true;
        grantedBy: true;
    };
}>;
export declare class AccessControlService {
    private readonly prisma;
    private readonly housesService;
    private readonly houseMembersService;
    private readonly userService;
    private readonly houseRolesService;
    constructor(prisma: PrismaService, housesService: HousesService, houseMembersService: HouseMembersService, userService: UserService, houseRolesService: HouseRolesService);
    createRight(dto: HouseAccessRightRequestDto, grantedByUserId: string): Promise<RightWithRelations>;
    updateRight(id: string, dto: HouseAccessRightRequestDto, userId: string): Promise<RightWithRelations>;
    deleteRight(id: string, userId: string): Promise<void>;
    findRightsByMemberId(memberId: string, page: number, size: number, sort: string): Promise<{
        content: RightWithRelations[];
        total: number;
    }>;
    findRightsByHouseId(houseId: string, page: number, size: number, sort: string): Promise<{
        content: RightWithRelations[];
        total: number;
    }>;
    checkAccess(dto: AccessCheckRequestDto): Promise<AccessCheckResponseDto>;
    cleanupExpiredRights(): Promise<void>;
}
export {};
