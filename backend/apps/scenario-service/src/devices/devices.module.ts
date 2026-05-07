import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PhysicalDeviceController } from './physical-device.controller';
import { PhysicalDeviceService } from './physical-device.service';
import { PhysicalDeviceRepository } from './physical-device.repository';
import {
  PHYSICAL_DEVICE_MODEL,
  PhysicalDeviceSchema,
} from '../mongo/schemas/physical-device.mongo';
import { DeviceCatalogModule } from '../device-catalog/device-catalog.module';
import { AccessSyncModule } from '../access-sync/access-sync.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PHYSICAL_DEVICE_MODEL, schema: PhysicalDeviceSchema },
    ]),
    DeviceCatalogModule,
    AccessSyncModule,
  ],
  controllers: [PhysicalDeviceController],
  providers: [PhysicalDeviceService, PhysicalDeviceRepository],
  exports: [PhysicalDeviceService],
})
export class DevicesModule {}
