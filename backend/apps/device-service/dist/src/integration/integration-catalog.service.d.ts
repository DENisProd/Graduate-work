import { PrismaService } from '../prisma/prisma.service';
import { EnsureCatalogRequestDto } from './dto/ensure-catalog-request.dto';
import { EnsureCatalogResponseDto } from './dto/ensure-catalog-response.dto';
export declare class IntegrationCatalogService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private buildTranslationRows;
    private isUniqueConstraint;
    ensureCatalog(dto: EnsureCatalogRequestDto): Promise<EnsureCatalogResponseDto>;
}
