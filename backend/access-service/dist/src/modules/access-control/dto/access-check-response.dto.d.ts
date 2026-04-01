export declare class AccessRightDetailDto {
    rightId: string;
    type: string;
    deviceId?: string;
    deviceFunctionId?: string;
    houseRoomId?: string;
    isExpired: boolean;
}
export declare class AccessCheckResponseDto {
    hasAccess: boolean;
    effectiveRightType?: string;
    applicableRights: AccessRightDetailDto[];
    reason: string;
}
