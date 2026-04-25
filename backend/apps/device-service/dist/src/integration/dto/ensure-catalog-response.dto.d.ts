export declare class CatalogEnsureCreatedFlagsDto {
    category: boolean;
    device: boolean;
}
export declare class EnsureCatalogResponseDto {
    deviceId: number;
    deviceCategoryId: number;
    created: CatalogEnsureCreatedFlagsDto;
}
