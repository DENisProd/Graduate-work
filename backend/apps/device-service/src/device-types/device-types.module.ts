import { Module } from '@nestjs/common';
import { DeviceTypesService } from './device-types.service';
import { DeviceTypesController } from './device-types.controller';

@Module({
  controllers: [DeviceTypesController],
  providers: [DeviceTypesService],
})
export class DeviceTypesModule {}

