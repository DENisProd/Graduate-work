import { PrismaService } from '../../prisma/prisma.service';
import { AccessRight, ResourceType } from '@prisma/client';
import { ResourcesService } from '../resources/resources.service';
import { UsersService } from '../users/users.service';
import { CreateAccessRightDto } from './dto/create-access-right.dto';
import { AuditService } from '../audit/audit.service';
import { AccessStructureResponseDto } from './dto/access-structure-response.dto';
import { HouseRolesService } from '../../../src/modules/house-roles/house-roles.service';
import { HouseMembersService } from '../../../src/modules/house-members/house-members.service';
type AccessRightWithResource = AccessRight & {
    resource: {
        type: ResourceType;
        depth: number;
    };
};
export declare class PermissionsService {
    private readonly prisma;
    private readonly resourcesService;
    private readonly membersService;
    private readonly rolesService;
    private readonly usersService;
    private readonly auditService;
    private readonly accessRightWithResourceInclude;
    constructor(prisma: PrismaService, resourcesService: ResourcesService, membersService: HouseMembersService, rolesService: HouseRolesService, usersService: UsersService, auditService: AuditService);
    create(dto: CreateAccessRightDto, grantedByExternalUserId: string): Promise<AccessRight>;
    findById(id: string): Promise<AccessRight>;
    delete(id: string): Promise<void>;
    findByResourceId(resourceId: string): Promise<AccessRightWithResource[]>;
    findByUserId(externalUserId: string): Promise<AccessRightWithResource[]>;
    rebuildCache(): Promise<void>;
    getAccessStructure(externalUserId: string): Promise<AccessStructureResponseDto>;
}
export {};
