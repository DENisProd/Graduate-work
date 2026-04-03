import { Module } from '@nestjs/common';
import { DeviceFunctionsService } from './device-functions.service';
import { DeviceFunctionsController } from './device-functions.controller';

@Module({
  controllers: [DeviceFunctionsController],
  providers: [DeviceFunctionsService],
})
export class DeviceFunctionsModule {}

