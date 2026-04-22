import { Module } from '@nestjs/common';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { AdminDevicesController } from '../admin/admin-devices.controller';

@Module({
  controllers: [DevicesController, AdminDevicesController],
  providers: [DevicesService],
  exports: [DevicesService],
})
export class DevicesModule {}

