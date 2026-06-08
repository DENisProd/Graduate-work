import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ZigbeeController } from './zigbee.controller';
import { ZigbeeService } from './zigbee.service';
import { ZigbeeDeviceRepository } from './zigbee-device.repository';
import { ZigbeeLinkRepository } from './zigbee-link.repository';
import { ZigbeeStateRepository } from './zigbee-state.repository';
import {
  PHYSICAL_DEVICE_MODEL,
  PhysicalDeviceSchema,
} from '../mongo/schemas/physical-device.mongo';
import {
  DEVICE_NETWORK_LINK_MODEL,
  DeviceNetworkLinkSchema,
} from '../mongo/schemas/device-network-link.mongo';
import {
  ZIGBEE_STATE_MODEL,
  ZigbeeStateSchema,
} from '../mongo/schemas/zigbee-state.mongo';
import {
  ZIGBEE_DEVICE_LOG_MODEL,
  ZigbeeDeviceLogSchema,
} from '../mongo/schemas/zigbee-device-log.mongo';
import {
  HOUSE_MQTT_CONFIG_MODEL,
  HouseMqttConfigSchema,
} from '../mongo/schemas/house-mqtt-config.mongo';
import { ZigbeeMqttService } from './zigbee-mqtt.service';
import { ZigbeeIngestService } from './zigbee-ingest.service';
import { ZigbeeDeviceLogRepository } from './zigbee-device-log.repository';
import { ZigbeeRealtimeService } from './zigbee-realtime.service';
import { ZigbeeRealtimeGateway } from './zigbee-realtime.gateway';
import { EmqxProvisionService } from './emqx-provision.service';
import { HouseMqttConfigRepository } from './house-mqtt-config.repository';
import { DeviceDataModule } from '../device-data/device-data.module';
import { DeviceCatalogModule } from '../device-catalog/device-catalog.module';

@Module({
  imports: [
    DeviceDataModule,
    DeviceCatalogModule,
    MongooseModule.forFeature([
      { name: PHYSICAL_DEVICE_MODEL, schema: PhysicalDeviceSchema },
      { name: DEVICE_NETWORK_LINK_MODEL, schema: DeviceNetworkLinkSchema },
      { name: ZIGBEE_STATE_MODEL, schema: ZigbeeStateSchema },
      { name: ZIGBEE_DEVICE_LOG_MODEL, schema: ZigbeeDeviceLogSchema },
      { name: HOUSE_MQTT_CONFIG_MODEL, schema: HouseMqttConfigSchema },
    ]),
  ],
  controllers: [ZigbeeController],
  providers: [
    ZigbeeService,
    ZigbeeIngestService,
    ZigbeeMqttService,
    ZigbeeDeviceRepository,
    ZigbeeLinkRepository,
    ZigbeeStateRepository,
    ZigbeeDeviceLogRepository,
    ZigbeeRealtimeService,
    ZigbeeRealtimeGateway,
    HouseMqttConfigRepository,
    EmqxProvisionService,
  ],
  exports: [ZigbeeService, ZigbeeIngestService],
})
export class ZigbeeModule {}
