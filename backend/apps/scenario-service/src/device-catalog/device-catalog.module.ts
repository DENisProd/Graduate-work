import { Module } from '@nestjs/common';
import { DeviceCatalogClient } from './device-catalog.client';
import { DeviceCatalogService } from './device-catalog.service';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [LlmModule],
  providers: [DeviceCatalogClient, DeviceCatalogService],
  exports: [DeviceCatalogService],
})
export class DeviceCatalogModule {}
