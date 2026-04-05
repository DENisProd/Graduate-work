import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { isValidObjectId } from 'mongoose';
import { DeviceDataType } from '../common/schemas/enums';
import { DeviceDataRepository } from './device-data.repository';
import type {
  CreateDeviceDataInput,
  ListDeviceDataQuery,
} from './schemas/device-data.schema';

function asNumber(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function asBoolean(v: unknown): boolean | undefined {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number')
    return v === 1 ? true : v === 0 ? false : undefined;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(s)) return true;
    if (['false', '0', 'no', 'off'].includes(s)) return false;
  }
  return undefined;
}

@Injectable()
export class DeviceDataService {
  private readonly logger = new Logger(DeviceDataService.name);

  constructor(private readonly repository: DeviceDataRepository) {}

  async create(data: CreateDeviceDataInput) {
    return this.repository.create(data);
  }

  async findMany(query: ListDeviceDataQuery) {
    return this.repository.findMany(query);
  }

  async findById(id: string) {
    const row = await this.repository.findById(id);
    if (!row) throw new NotFoundException(`DeviceData ${id} not found`);
    return row;
  }

  async remove(id: string) {
    await this.findById(id);
    return this.repository.delete(id);
  }

  /**
   * Разложить payload zigbee2mqtt в строки DeviceData (для GET /device-data).
   */
  async ingestFromZigbeePayload(
    physicalDeviceId: string,
    payload: Record<string, unknown>,
    at: Date,
  ): Promise<void> {
    if (!isValidObjectId(physicalDeviceId)) return;
    const rows: CreateDeviceDataInput[] = [];

    const addNum = (
      capability: string,
      attribute: string,
      v: unknown,
      unit?: string,
    ) => {
      const n = asNumber(v);
      if (n === undefined) return;
      const isFloat = !Number.isInteger(n);
      rows.push({
        deviceId: physicalDeviceId,
        capability,
        attribute,
        type: isFloat ? DeviceDataType.FLOAT : DeviceDataType.NUMBER,
        value: n,
        ...(unit ? { unit } : {}),
        timestamp: at,
      });
    };

    const addBool = (capability: string, attribute: string, v: unknown) => {
      const b = asBoolean(v);
      if (b === undefined) return;
      rows.push({
        deviceId: physicalDeviceId,
        capability,
        attribute,
        type: DeviceDataType.BOOLEAN,
        value: b,
        timestamp: at,
      });
    };

    addNum('battery', 'level', payload.battery, '%');
    addBool('battery', 'low', payload.battery_low);
    addNum('zigbee', 'linkquality', payload.linkquality);
    addBool('occupancy', 'motion', payload.occupancy);
    addBool('tamper', 'active', payload.tamper);
    addNum('power', 'voltage', payload.voltage, 'mV');
    addNum('climate', 'temperature', payload.temperature, '°C');
    addNum('climate', 'humidity', payload.humidity, '%');
    addNum('light', 'brightness', payload.brightness);
    addNum('climate', 'pressure', payload.pressure, 'hPa');
    addNum('illuminance', 'value', payload.illuminance, 'lx');

    const state = payload.state;
    if (typeof state === 'string' && state.length > 0) {
      rows.push({
        deviceId: physicalDeviceId,
        capability: 'switch',
        attribute: 'state',
        type: DeviceDataType.STRING,
        value: state,
        timestamp: at,
      });
    }

    addBool('contact', 'open', payload.contact);
    addBool('water_leak', 'detected', payload.water_leak);

    if (rows.length === 0) return;
    try {
      await Promise.all(rows.map((r) => this.repository.create(r)));
    } catch (e) {
      this.logger.warn(
        `DeviceData ingest: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }
}
