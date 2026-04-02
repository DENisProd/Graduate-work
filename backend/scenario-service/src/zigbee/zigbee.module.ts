import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ZigbeeController } from './zigbee.controller';
import { ZigbeeService } from './zigbee.service';
import {
  ZigbeeDeviceRepository,
} from './zigbee-device.repository';
import {
  ZigbeeLinkRepository,
} from './zigbee-link.repository';
import {
  ZigbeeStateRepository,
} from './zigbee-state.repository';
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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PHYSICAL_DEVICE_MODEL, schema: PhysicalDeviceSchema },
      { name: DEVICE_NETWORK_LINK_MODEL, schema: DeviceNetworkLinkSchema },
      { name: ZIGBEE_STATE_MODEL, schema: ZigbeeStateSchema },
    ]),
  ],
  controllers: [ZigbeeController],
  providers: [
    ZigbeeService,
    ZigbeeDeviceRepository,
    ZigbeeLinkRepository,
    ZigbeeStateRepository,
  ],
  exports: [ZigbeeService],
})
export class ZigbeeModule {}

