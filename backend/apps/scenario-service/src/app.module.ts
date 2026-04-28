import { join } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DevicesModule } from './devices/devices.module';
import { ScenarioModule } from './scenario/scenario.module';
import { ScenarioExecutionModule } from './scenario-execution/scenario-execution.module';
import { DeviceDataModule } from './device-data/device-data.module';
import { ZigbeeModule } from './zigbee/zigbee.module';
import { LlmModule } from './llm/llm.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: join(__dirname, '../../.env'),
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url =
          config.get<string>('SCENARIO_DATABASE_URL') ??
          process.env.SCENARIO_DATABASE_URL;
        if (!url) {
          throw new Error('SCENARIO_DATABASE_URL is not set');
        }
        return { uri: url };
      },
    }),
    LlmModule,
    DevicesModule,
    ScenarioModule,
    ScenarioExecutionModule,
    DeviceDataModule,
    ZigbeeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
