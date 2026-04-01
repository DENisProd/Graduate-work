import { PrismaService } from '../../prisma/prisma.service';
import { HousesService } from '../houses/houses.service';
import { HousePermission } from '@prisma/client';
export declare class HouseRolesService {
    private readonly prisma;
    private readonly housesService;
    constructor(prisma: PrismaService, housesService: HousesService);
    createDefaultRolesForHouse(houseId: string, ownerMemberId: string): Promise<void>;
    ensureOwnerFullAccessForHouse(houseId: string): Promise<void>;
    private grantOwnerFullResourceAccess;
    getRoleByHouseAndName(houseId: string, name: string): Promise<{
        permissions: {
            id: string;
            roleId: string;
            permission: import("@prisma/client").$Enums.HousePermission;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        houseId: string;
        updatedAt: Date;
        priority: number;
        isSystem: boolean;
    }>;
    getDefaultRoleForHouse(houseId: string): Promise<{
        permissions: {
            id: string;
            roleId: string;
            permission: import("@prisma/client").$Enums.HousePermission;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        houseId: string;
        updatedAt: Date;
        priority: number;
        isSystem: boolean;
    }>;
    getNextAvailablePriority(houseId: string): Promise<number>;
    canAssignRoleForInvitation(houseId: string, inviterUserId: string, roleId: string): Promise<boolean>;
    assertCanInviteWithPermissions(houseId: string, inviterUserId: string, permissions: HousePermission[]): Promise<void>;
    getMemberBestPriority(houseId: string, memberId: string): Promise<number>;
    hasPermission(houseId: string, userId: string, permission: HousePermission): Promise<boolean>;
    canEditMemberRights(houseId: string, editorUserId: string, targetMemberId: string): Promise<boolean>;
    canInviteMembers(houseId: string, userId: string): Promise<boolean>;
    canEditRoleRights(houseId: string, editorUserId: string, roleId: string): Promise<boolean>;
    findById(roleId: string): Promise<{
        house: {
            name: string;
            id: string;
            avatarUrl: string | null;
            createdAt: Date;
            ownerId: string | null;
            address: string | null;
            conflictStrategy: import("@prisma/client").$Enums.ConflictResolutionStrategy;
            updatedAt: Date;
        };
        permissions: {
            id: string;
            roleId: string;
            permission: import("@prisma/client").$Enums.HousePermission;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        houseId: string;
        updatedAt: Date;
        priority: number;
        isSystem: boolean;
    }>;
    findByHouseId(houseId: string): Promise<({
        permissions: {
            id: string;
            roleId: string;
            permission: import("@prisma/client").$Enums.HousePermission;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        houseId: string;
        updatedAt: Date;
        priority: number;
        isSystem: boolean;
    })[]>;
    createCustomRole(houseId: string, name: string, priority: number, editorUserId: string): Promise<{
        permissions: {
            id: string;
            roleId: string;
            permission: import("@prisma/client").$Enums.HousePermission;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        houseId: string;
        updatedAt: Date;
        priority: number;
        isSystem: boolean;
    }>;
    deleteRole(roleId: string): Promise<void>;
    assignRoleToMember(memberId: string, roleId: string, editorUserId: string): Promise<void>;
    unassignRoleFromMember(memberId: string, roleId: string, editorUserId: string): Promise<void>;
}
