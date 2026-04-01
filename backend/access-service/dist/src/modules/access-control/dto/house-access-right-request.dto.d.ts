import { AccessRightType } from '@prisma/client';
export declare class HouseAccessRightRequestDto {
    resourceId: string;
    houseMemberId?: string;
    houseRoleId?: string;
    accessRightType: AccessRightType;
    parameters?: Record<string, string>;
    expiresAt?: Date;
}
