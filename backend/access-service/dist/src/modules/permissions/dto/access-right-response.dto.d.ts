import { AccessRightType, ResourceType } from '@prisma/client';
export declare class AccessRightResourceDto {
    type: ResourceType;
    depth: number;
}
export declare class AccessRightResponseDto {
    id: string;
    resourceId: string;
    houseMemberId?: string;
    roleId?: string;
    accessRightType: AccessRightType;
    parameters?: Record<string, unknown>;
    expiresAt?: string;
    createdAt: string;
    resource?: AccessRightResourceDto;
}
