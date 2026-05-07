import { Module } from '@nestjs/common';
import { DeviceTypesService } from './device-types.service';
import { DeviceTypesController } from './device-types.controller';
import { AdminDeviceTypesController } from '../admin/admin-device-types.controller';

@Module({
  controllers: [DeviceTypesController, AdminDeviceTypesController],
  providers: [DeviceTypesService],
})
export class DeviceTypesModule {}
