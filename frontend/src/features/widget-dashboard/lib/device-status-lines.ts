import type { DeviceType } from '@/domain/room-planner';
import type { PhysicalDeviceResponse, ZigbeeStateWire } from '@/types/api';
import { connectivityFromLastOnline, connectivityLabel } from '@/lib/device-connectivity';
import { readPayloadValue } from './useWidgetTelemetry';

export interface DeviceStatusLine {
  text: string;
  tone?: 'ok' | 'warn' | 'muted' | 'danger';
}

export interface DeviceMetricEntry {
  label: string;
  value: string;
}

type MetricLabelFn = (key: string) => string;

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

function payloadNumberFirst(state: ZigbeeStateWire, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = readPayloadValue(state, key);
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') {
      const n = Number(value);
      if (Number.isFinite(n)) return n;
    }
  }
  return undefined;
}

function formatStateValue(value: string, yes: string, no: string): string {
  const normalized = value.trim().toUpperCase();
  if (normalized === 'ON' || normalized === 'TRUE' || normalized === '1') return yes;
  if (normalized === 'OFF' || normalized === 'FALSE' || normalized === '0') return no;
  return value;
}

export function getDeviceMetricEntries(
  state: ZigbeeStateWire | undefined,
  t: MetricLabelFn,
): DeviceMetricEntry[] {
  if (!state) return [];

  const entries: DeviceMetricEntry[] = [];
  const yes = t('common.yes');
  const no = t('common.no');
  const m = state.metrics;
  const telemetry = 'admin.accessControl.connectedDevices';

  if (typeof m?.state === 'string' && m.state.trim().length > 0) {
    entries.push({
      label: t(`${telemetry}.telemetryState`),
      value: formatStateValue(m.state, yes, no),
    });
  }

  if (typeof m?.brightness === 'number' && !Number.isNaN(m.brightness)) {
    const pct = Math.round((m.brightness / 254) * 100);
    entries.push({
      label: t(`${telemetry}.telemetryBrightness`),
      value: `${pct}%`,
    });
  }

  if (typeof m?.occupancy === 'boolean') {
    entries.push({
      label: t(`${telemetry}.telemetryOccupancy`),
      value: m.occupancy ? yes : no,
    });
  }

  const temperature =
    typeof m?.temperature === 'number' && !Number.isNaN(m.temperature)
      ? m.temperature
      : payloadNumberFirst(state, ['temperature', 'device_temperature', 'local_temperature']);
  if (typeof temperature === 'number' && !Number.isNaN(temperature)) {
    entries.push({
      label: t(`${telemetry}.telemetryTemp`),
      value: `${Number.isInteger(temperature) ? temperature : temperature.toFixed(1)}°`,
    });
  }

  if (typeof m?.humidity === 'number' && !Number.isNaN(m.humidity)) {
    entries.push({
      label: t(`${telemetry}.telemetryHumidity`),
      value: `${m.humidity}%`,
    });
  }

  if (typeof m?.battery === 'number' && !Number.isNaN(m.battery)) {
    entries.push({
      label: t(`${telemetry}.telemetryBattery`),
      value: `${m.battery}%`,
    });
  }

  if (typeof m?.colorMode === 'string' && m.colorMode.trim().length > 0) {
    entries.push({
      label: t(`${telemetry}.telemetryColorMode`),
      value: m.colorMode,
    });
  }

  if (typeof m?.linkquality === 'number' && !Number.isNaN(m.linkquality)) {
    entries.push({
      label: t(`${telemetry}.telemetryLink`),
      value: String(m.linkquality),
    });
  }

  const power = payloadNumberFirst(state, ['power', 'instantaneous_power', 'power_w']);
  if (power != null) {
    const formatted = formatNumber(power, ' Вт');
    if (formatted) {
      entries.push({ label: t('dashboard.overview.widgets.floorPlanPower'), value: formatted });
    }
  }

  const voltage = payloadNumberFirst(state, ['voltage', 'rms_voltage']);
  if (voltage != null) {
    const formatted = formatNumber(voltage, ' В');
    if (formatted) {
      entries.push({ label: t(`${telemetry}.telemetryVoltage`), value: formatted });
    }
  }

  const current = payloadNumberFirst(state, ['current', 'rms_current']);
  if (current != null) {
    const formatted = formatNumber(current, ' А');
    if (formatted) {
      entries.push({ label: t('dashboard.overview.widgets.floorPlanCurrent'), value: formatted });
    }
  }

  const energy = payloadNumberFirst(state, ['energy', 'total_energy']);
  if (energy != null) {
    const formatted = formatNumber(energy, ' кВт·ч');
    if (formatted) {
      entries.push({ label: t('dashboard.overview.widgets.floorPlanEnergy'), value: formatted });
    }
  }

  const seen = new Set(entries.map((e) => e.label));
  for (const [key, raw] of Object.entries(state.payload ?? {})) {
    if (entries.length >= 8) break;
    if (key === 'state' || key.endsWith('_id')) continue;
    if (raw == null || typeof raw === 'object') continue;

    const label = key.replace(/_/g, ' ');
    if (seen.has(label)) continue;

    let value: string | null = null;
    if (typeof raw === 'boolean') value = raw ? yes : no;
    else if (typeof raw === 'number' && Number.isFinite(raw)) value = String(raw);
    else if (typeof raw === 'string' && raw.trim()) value = raw.trim();

    if (value) {
      entries.push({ label, value });
      seen.add(label);
    }
  }

  return entries.slice(0, 8);
}
