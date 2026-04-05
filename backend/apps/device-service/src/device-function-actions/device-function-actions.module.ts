import { Module } from '@nestjs/common';
import { DeviceFunctionActionsService } from './device-function-actions.service';
import { DeviceFunctionActionsController } from './device-function-actions.controller';

@Module({
  controllers: [DeviceFunctionActionsController],
  providers: [DeviceFunctionActionsService],
})
export class DeviceFunctionActionsModule {}

