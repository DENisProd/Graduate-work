import { AccessRightType } from '@prisma/client';
export declare class CreateAccessRightDto {
    resourceId: string;
    houseMemberId?: string;
    roleId?: string;
    accessRightType: AccessRightType;
    expiresAt?: Date;
}
