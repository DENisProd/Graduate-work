export declare class CatalogTranslationItemDto {
    name: string;
    description?: string | null;
}
export declare class EnsureCatalogTranslationsDto {
    deviceType?: Record<string, CatalogTranslationItemDto>;
    deviceCategory?: Record<string, CatalogTranslationItemDto>;
    device?: Record<string, CatalogTranslationItemDto>;
}
export declare class EnsureCatalogRequestDto {
    deviceTypeCode: string;
    deviceCategoryCode: string;
    deviceCode: string;
    translations?: EnsureCatalogTranslationsDto;
}
