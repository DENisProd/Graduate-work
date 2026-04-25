import { Module } from '@nestjs/common';
import { IntegrationCatalogController } from './integration-catalog.controller';
import { IntegrationCatalogService } from './integration-catalog.service';

@Module({
  controllers: [IntegrationCatalogController],
  providers: [IntegrationCatalogService],
})
export class IntegrationModule {}
