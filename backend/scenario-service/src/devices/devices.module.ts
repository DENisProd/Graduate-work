import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PhysicalDeviceController } from './physical-device.controller';
import { PhysicalDeviceService } from './physical-device.service';
import {
  PHYSICAL_DEVICE_MODEL,
  PhysicalDeviceRepository,
  PhysicalDeviceSchema,
} from './physical-device.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PHYSICAL_DEVICE_MODEL, schema: PhysicalDeviceSchema },
    ]),
  ],
  controllers: [PhysicalDeviceController],
  providers: [PhysicalDeviceService, PhysicalDeviceRepository],
  exports: [PhysicalDeviceService],
})
export class DevicesModule {}
