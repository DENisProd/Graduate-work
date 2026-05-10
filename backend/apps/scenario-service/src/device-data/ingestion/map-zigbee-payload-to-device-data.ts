import { DeviceDataType } from '../../common/schemas/enums';
import type { CreateDeviceDataInput } from '../schemas/device-data.schema';
import { ZIGBEE_PAYLOAD_DEVICE_DATA_RULES } from './zigbee-payload-device-data.rules';

function attributeSlice(
  attribute: string | undefined,
): Pick<CreateDeviceDataInput, 'attribute'> | Record<string, never> {
  const a = attribute?.trim();
  return a && a.length > 0 ? { attribute: a } : {};
}

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

function coalesceNumber(
  payload: Record<string, unknown>,
  sources: readonly string[],
): number | undefined {
  for (const key of sources) {
    const n = asNumber(payload[key]);
    if (n !== undefined) return n;
  }
  return undefined;
}

function coalesceBoolean(
  payload: Record<string, unknown>,
  sources: readonly string[],
): boolean | undefined {
  for (const key of sources) {
    const b = asBoolean(payload[key]);
    if (b !== undefined) return b;
  }
  return undefined;
}

function coalesceString(
  payload: Record<string, unknown>,
  sources: readonly string[],
): string | undefined {
  for (const key of sources) {
    const v = payload[key];
    if (typeof v === 'string') return v;
  }
  return undefined;
}

/**
 * Applies {@link ZIGBEE_PAYLOAD_DEVICE_DATA_RULES} to a Zigbee2MQTT device JSON payload.
 */
export function mapZigbeePayloadToDeviceDataInputs(
  physicalDeviceId: string,
  payload: Record<string, unknown>,
  at: Date,
): CreateDeviceDataInput[] {
  const rows: CreateDeviceDataInput[] = [];

  for (const rule of ZIGBEE_PAYLOAD_DEVICE_DATA_RULES) {
    switch (rule.kind) {
      case 'number': {
        const n = coalesceNumber(payload, rule.sources);
        if (n === undefined) break;
        const isFloat = !Number.isInteger(n);
        rows.push({
          deviceId: physicalDeviceId,
          capability: rule.capability,
          ...attributeSlice(rule.attribute),
          type: isFloat ? DeviceDataType.FLOAT : DeviceDataType.NUMBER,
          value: n,
          ...(rule.unit ? { unit: rule.unit } : {}),
          timestamp: at,
        });
        break;
      }
      case 'boolean': {
        const b = coalesceBoolean(payload, rule.sources);
        if (b === undefined) break;
        rows.push({
          deviceId: physicalDeviceId,
          capability: rule.capability,
          ...attributeSlice(rule.attribute),
          type: DeviceDataType.BOOLEAN,
          value: b,
          timestamp: at,
        });
        break;
      }
      case 'string': {
        let s = coalesceString(payload, rule.sources);
        if (s === undefined) break;
        s = s.trim();
        const min = rule.minLength ?? 1;
        if (s.length < min) break;
        rows.push({
          deviceId: physicalDeviceId,
          capability: rule.capability,
          ...attributeSlice(rule.attribute),
          type: DeviceDataType.STRING,
          value: s,
          timestamp: at,
        });
        break;
      }
    }
  }

  return rows;
}
