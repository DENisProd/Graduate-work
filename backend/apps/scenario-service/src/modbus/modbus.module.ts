import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  MODBUS_DEVICE_MODEL,
  ModbusDeviceSchema,
} from '../mongo/schemas/modbus-device.mongo';
import {
  MODBUS_REGISTER_MODEL,
  MODBUS_REGISTER_STATE_MODEL,
  ModbusRegisterSchema,
  ModbusRegisterStateSchema,
} from '../mongo/schemas/modbus-register.mongo';
import { ModbusDeviceRepository } from './modbus-device.repository';
import { ModbusGatewayService } from './modbus-gateway.service';
import { ModbusService } from './modbus.service';
import { ModbusController } from './modbus.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MODBUS_DEVICE_MODEL, schema: ModbusDeviceSchema },
      { name: MODBUS_REGISTER_MODEL, schema: ModbusRegisterSchema },
      { name: MODBUS_REGISTER_STATE_MODEL, schema: ModbusRegisterStateSchema },
    ]),
  ],
  controllers: [ModbusController],
  providers: [ModbusDeviceRepository, ModbusGatewayService, ModbusService],
  exports: [ModbusService],
})
export class ModbusModule {}
