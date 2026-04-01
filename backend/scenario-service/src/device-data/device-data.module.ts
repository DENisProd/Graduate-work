import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DeviceDataController } from './device-data.controller';
import { DeviceDataService } from './device-data.service';
import {
  DEVICE_DATA_MODEL,
  DeviceDataRepository,
  DeviceDataSchema,
} from './device-data.repository';
import { DevicesModule } from '../devices/devices.module';
import { DeviceDataGeneratorService } from './device-data.generator';

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
    DeviceDataGeneratorService,
  ],
  exports: [DeviceDataService],
})
export class DeviceDataModule {}
