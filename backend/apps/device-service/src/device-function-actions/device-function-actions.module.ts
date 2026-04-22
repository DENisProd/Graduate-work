import { Module } from '@nestjs/common';
import { DeviceFunctionActionsService } from './device-function-actions.service';
import { DeviceFunctionActionsController } from './device-function-actions.controller';
import { AdminDeviceFunctionActionsController } from '../admin/admin-device-function-actions.controller';

@Module({
  controllers: [DeviceFunctionActionsController, AdminDeviceFunctionActionsController],
  providers: [DeviceFunctionActionsService],
})
export class DeviceFunctionActionsModule {}

