export declare class DeviceFunctionNodeDto {
    id: string;
    externalId?: string;
}
export declare class DeviceNodeDto {
    id: string;
    externalId?: string;
    functions: DeviceFunctionNodeDto[];
}
export declare class RoomNodeDto {
    id: string;
    name?: string;
    externalId?: string;
    devices: DeviceNodeDto[];
}
export declare class HouseStructureDto {
    id: string;
    name: string;
    rooms: RoomNodeDto[];
}
export declare class AccessStructureResponseDto {
    houses: HouseStructureDto[];
}
