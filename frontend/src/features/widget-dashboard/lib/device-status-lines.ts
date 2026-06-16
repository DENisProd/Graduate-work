import type { DeviceType } from '@/domain/room-planner';
import type { PhysicalDeviceResponse, ZigbeeStateWire } from '@/types/api';
import { connectivityFromLastOnline, connectivityLabel } from '@/lib/device-connectivity';
import { readPayloadValue } from './useWidgetTelemetry';

export interface DeviceStatusLine {
  text: string;
  tone?: 'ok' | 'warn' | 'muted' | 'danger';
}

function formatNumber(value: unknown, unit?: string): string | null {
  if (value == null) return null;
  const n = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(n)) return null;
  const formatted = Number.isInteger(n) ? String(n) : n.toFixed(1);
  return unit ? `${formatted}${unit}` : formatted;
}

function readFirst(state: ZigbeeStateWire | undefined, keys: string[]): unknown {
  if (!state) return null;
  for (const key of keys) {
    const value = readPayloadValue(state, key);
    if (value != null) return value;
  }
  return null;
}

export function getDeviceStatusLines(
  deviceType: DeviceType,
  physicalDevice: PhysicalDeviceResponse | undefined,
  state: ZigbeeStateWire | undefined,
  locale = 'ru',
): DeviceStatusLine[] {
  const lines: DeviceStatusLine[] = [];
  const connectivity = connectivityFromLastOnline(state?.timestamp ?? physicalDevice?.lastSeen);
  lines.push({
    text: connectivityLabel(connectivity, locale),
    tone: connectivity === 'ONLINE' ? 'ok' : connectivity === 'UNKNOWN' ? 'warn' : 'muted',
  });

  switch (deviceType) {
    case 'temperature-sensor': {
      const temp = formatNumber(readFirst(state, ['temperature', 'local_temperature']), '°C');
      const humidity = formatNumber(readFirst(state, ['humidity', 'relative_humidity']), '%');
      if (temp) lines.push({ text: temp, tone: 'ok' });
      if (humidity) lines.push({ text: `💧 ${humidity}`, tone: 'muted' });
      break;
    }
    case 'motion-sensor': {
      const occupancy = readFirst(state, ['occupancy', 'motion', 'presence']);
      if (occupancy != null) {
        const active =
          occupancy === true ||
          occupancy === 'ON' ||
          occupancy === 'occupied' ||
          occupancy === 1;
        lines.push({
          text: active ? 'Движение' : 'Тишина',
          tone: active ? 'warn' : 'muted',
        });
      }
      const battery = formatNumber(readFirst(state, ['battery', 'battery_percent']), '%');
      if (battery) lines.push({ text: `🔋 ${battery}`, tone: 'muted' });
      break;
    }
    case 'dimmer': {
      const power = readFirst(state, ['state']);
      if (power != null) {
        const on =
          power === 'ON' ||
          power === true ||
          (typeof power === 'string' && power.toLowerCase() === 'on');
        lines.push({ text: on ? 'Вкл' : 'Выкл', tone: on ? 'ok' : 'muted' });
      }
      const brightness = readFirst(state, ['brightness']);
      if (brightness != null) {
        const pct = Math.round((Number(brightness) / 254) * 100);
        if (!Number.isNaN(pct)) lines.push({ text: `Яркость ${pct}%`, tone: 'ok' });
      }
      break;
    }
    case 'switch':
    case 'socket': {
      const power = readFirst(state, ['state', 'power_on_behavior']);
      if (power != null) {
        const on =
          power === 'ON' ||
          power === true ||
          (typeof power === 'string' && power.toLowerCase() === 'on');
        lines.push({ text: on ? 'Вкл' : 'Выкл', tone: on ? 'ok' : 'muted' });
      }
      const powerW = formatNumber(readFirst(state, ['power', 'instantaneous_power']), ' Вт');
      if (powerW) lines.push({ text: powerW, tone: 'ok' });
      break;
    }
    case 'camera': {
      const recording = readFirst(state, ['state', 'recording']);
      if (recording != null) {
        const on =
          recording === 'ON' ||
          recording === true ||
          (typeof recording === 'string' && recording.toLowerCase() === 'on');
        lines.push({ text: on ? 'Запись' : 'Пауза', tone: on ? 'ok' : 'muted' });
      }
      break;
    }
    default:
      break;
  }

  return lines.slice(0, 4);
}
