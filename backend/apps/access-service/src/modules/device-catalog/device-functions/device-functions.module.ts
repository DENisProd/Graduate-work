import { Module } from '@nestjs/common';
import { DeviceFunctionsService } from './device-functions.service';
import { DeviceFunctionsController } from './device-functions.controller';
import { AdminDeviceFunctionsController } from '../admin/admin-device-functions.controller';

@Module({
  controllers: [DeviceFunctionsController, AdminDeviceFunctionsController],
  providers: [DeviceFunctionsService],
})
export class DeviceFunctionsModule {}
