import { EnsureCatalogRequestDto } from './dto/ensure-catalog-request.dto';
import { EnsureCatalogResponseDto } from './dto/ensure-catalog-response.dto';
import { IntegrationCatalogService } from './integration-catalog.service';
export declare class IntegrationCatalogController {
    private readonly integrationCatalog;
    constructor(integrationCatalog: IntegrationCatalogService);
    ensure(body: EnsureCatalogRequestDto): Promise<EnsureCatalogResponseDto>;
}
