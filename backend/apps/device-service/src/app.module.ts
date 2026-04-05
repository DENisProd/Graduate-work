import { join } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DevicesModule } from './devices/devices.module';
import { PrismaModule } from './prisma/prisma.module';
import { DeviceTypesModule } from './device-types/device-types.module';
import { DeviceCategoriesModule } from './device-categories/device-categories.module';
import { DeviceFunctionsModule } from './device-functions/device-functions.module';
import { DeviceFunctionActionsModule } from './device-function-actions/device-function-actions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(__dirname, '../../../.env'),
    }),
    PrismaModule,
    DevicesModule,
    DeviceTypesModule,
    DeviceCategoriesModule,
    DeviceFunctionsModule,
    DeviceFunctionActionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
