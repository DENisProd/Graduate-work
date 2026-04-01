export declare class HouseAccessRightResponseDto {
    id: string;
    houseId: string;
    houseName: string;
    houseMemberId?: string;
    houseRoleId?: string;
    houseRoleName?: string;
    userId?: string;
    userName?: string;
    deviceId?: string;
    deviceFunctionId?: string;
    houseRoomId?: string;
    houseRoomName?: string;
    accessRightType: string;
    parameters?: Record<string, string>;
    createdAt: string;
    grantedById?: string;
    grantedByName?: string;
    expiresAt?: string;
    isExpired: boolean;
    isActive: boolean;
}
