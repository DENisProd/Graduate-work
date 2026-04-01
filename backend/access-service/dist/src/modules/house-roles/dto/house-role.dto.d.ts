export declare class CreateHouseRoleRequestDto {
    name: string;
    priority: number;
}
export declare class HouseRoleResponseDto {
    id: string;
    name: string;
    houseId: string;
    priority: number;
    isSystem: boolean;
    permissions: string[];
}
