import { Module } from '@nestjs/common';
import { DeviceCategoriesService } from './device-categories.service';
import { DeviceCategoriesController } from './device-categories.controller';
import { AdminDeviceCategoriesController } from '../admin/admin-device-categories.controller';

@Module({
  controllers: [DeviceCategoriesController, AdminDeviceCategoriesController],
  providers: [DeviceCategoriesService],
})
export class DeviceCategoriesModule {}
