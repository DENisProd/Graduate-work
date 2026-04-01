import { HousePermission } from '@prisma/client';
export declare class HouseInvitationResponseDto {
    id: string;
    houseId: string;
    houseName: string;
    email: string;
    token: string;
    status: string;
    createdAt: string;
    acceptedAt?: string;
    expiresAt?: string;
    invitedById?: string;
    roleId?: string;
    roleName?: string;
    permissions?: HousePermission[];
}
