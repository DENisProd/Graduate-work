import { Module } from '@nestjs/common';
import { DevicesModule } from './devices/devices.module';
import { DeviceTypesModule } from './device-types/device-types.module';
import { DeviceCategoriesModule } from './device-categories/device-categories.module';
import { DeviceFunctionsModule } from './device-functions/device-functions.module';
import { DeviceFunctionActionsModule } from './device-function-actions/device-function-actions.module';
import { IntegrationModule } from './integration/integration.module';

@Module({
  imports: [
    DevicesModule,
    DeviceTypesModule,
    DeviceCategoriesModule,
    DeviceFunctionsModule,
    DeviceFunctionActionsModule,
    IntegrationModule,
  ],
})
export class DeviceCatalogModule {}
