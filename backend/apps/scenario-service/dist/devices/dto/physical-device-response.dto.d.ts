export declare class PhysicalDeviceResponseDto {
    id: string;
    name: string;
    description?: string | null;
    deviceTypeId: number;
    houseId: string;
    roomId?: string | null;
    deviceId?: number | null;
    deviceCategoryId?: number | null;
    firmwareVersion?: string | null;
    ipAddress?: string | null;
    macAddress?: string | null;
    serialNumber?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export declare class PhysicalDeviceListResponseDto {
    items: PhysicalDeviceResponseDto[];
    total: number;
}
