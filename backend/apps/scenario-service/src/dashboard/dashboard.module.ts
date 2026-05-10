import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PHYSICAL_DEVICE_MODEL,
  PhysicalDeviceSchema,
} from '../mongo/schemas/physical-device.mongo';
import { SCENARIO_MODEL, ScenarioSchema } from '../mongo/schemas/scenario.mongo';
import {
  ZIGBEE_DEVICE_LOG_MODEL,
  ZigbeeDeviceLogSchema,
} from '../mongo/schemas/zigbee-device-log.mongo';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PHYSICAL_DEVICE_MODEL, schema: PhysicalDeviceSchema },
      { name: SCENARIO_MODEL, schema: ScenarioSchema },
      { name: ZIGBEE_DEVICE_LOG_MODEL, schema: ZigbeeDeviceLogSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}

