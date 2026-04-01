import { HousePermission } from '@prisma/client';
export declare class HouseInvitationRequestDto {
    houseId: string;
    email?: string;
    roleId?: string;
    permissions?: HousePermission[];
    expiresAt?: Date;
}
