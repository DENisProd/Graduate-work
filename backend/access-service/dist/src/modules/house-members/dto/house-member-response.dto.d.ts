import { HouseAccessRightResponseDto } from '../../access-control/dto/house-access-right-response.dto';
export declare class HouseMemberRoleBriefDto {
    memberRoleId: string;
    roleId: string;
    name: string;
    priority: number;
    isSystem: boolean;
    permissions: string[];
    assignedAt: string;
}
export declare class MemberEffectivePermissionDto {
    resourceId: string;
    resourceType: string;
    name?: string;
    externalId?: string;
    path: string;
    accessRightType: string;
    sourceType: string;
    sourceId?: string;
    expiresAt?: string;
}
export declare class HouseMemberListItemDto {
    id: string;
    userId: string;
    userAvatarUrl?: string;
    joinedAt: string;
    roles: HouseMemberRoleBriefDto[];
}
export declare class HouseMemberResponseDto {
    id: string;
    userId: string;
    userAvatarUrl?: string;
    houseId: string;
    houseName: string;
    joinedAt: string;
    roles: HouseMemberRoleBriefDto[];
}
export declare class HouseMemberDetailResponseDto extends HouseMemberResponseDto {
    effectivePermissions: MemberEffectivePermissionDto[];
    directAccessRights: HouseAccessRightResponseDto[];
}
