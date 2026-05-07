import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EnsureCatalogRequestDto } from './dto/ensure-catalog-request.dto';
import { EnsureCatalogResponseDto } from './dto/ensure-catalog-response.dto';
import { IntegrationCatalogService } from './integration-catalog.service';

@ApiTags('Integration')
@Controller('integration/catalog')
export class IntegrationCatalogController {
  constructor(private readonly integrationCatalog: IntegrationCatalogService) {}

  @Post('ensure')
  @ApiOperation({
    summary: 'Идемпотентно обеспечить категорию и абстрактное устройство',
    description:
      'Создаёт отсутствующие сущности с `isModerated=false` или возвращает существующие без изменения `isModerated`.',
  })
  @ApiBody({ type: EnsureCatalogRequestDto })
  @ApiOkResponse({ type: EnsureCatalogResponseDto })
  ensure(@Body() body: EnsureCatalogRequestDto): Promise<EnsureCatalogResponseDto> {
    return this.integrationCatalog.ensureCatalog(body);
  }
}
