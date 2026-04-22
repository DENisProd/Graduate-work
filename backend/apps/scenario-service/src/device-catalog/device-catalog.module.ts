import { Module } from '@nestjs/common';
import { DeviceCatalogClient } from './device-catalog.client';
import { DeviceCatalogService } from './device-catalog.service';

@Module({
  providers: [DeviceCatalogClient, DeviceCatalogService],
  exports: [DeviceCatalogService],
})
export class DeviceCatalogModule {}
