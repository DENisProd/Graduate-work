import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DeviceDataController } from './device-data.controller';
import { DeviceDataService } from './device-data.service';
import { DeviceDataRepository } from './device-data.repository';
import { DevicesModule } from '../devices/devices.module';
import {
  DEVICE_DATA_MODEL,
  DeviceDataSchema,
} from '../mongo/schemas/device-data.mongo';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DEVICE_DATA_MODEL, schema: DeviceDataSchema },
    ]),
    DevicesModule,
  ],
  controllers: [DeviceDataController],
  providers: [
    DeviceDataService,
    DeviceDataRepository,
  ],
  exports: [DeviceDataService],
})
export class DeviceDataModule {}
