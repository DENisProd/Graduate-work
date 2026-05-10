/**
 * Catalog: Zigbee2MQTT bridge JSON payload keys → normalized DeviceData rows.
 * Extend this list when onboarding new exposes; ingestion logic stays generic.
 */

export type ZigbeePayloadNumericRule = Readonly<{
  kind: 'number';
  capability: string;
  /** Omitted or empty → single-series row (`key` = `capability:`) */
  attribute?: string;
  /** Zigbee payload keys, first resolvable numeric wins */
  sources: readonly string[];
  unit?: string;
}>;

export type ZigbeePayloadBooleanRule = Readonly<{
  kind: 'boolean';
  capability: string;
  attribute?: string;
  sources: readonly string[];
}>;

export type ZigbeePayloadStringRule = Readonly<{
  kind: 'string';
  capability: string;
  attribute?: string;
  sources: readonly string[];
  /** drop values shorter than this (after trim) */
  minLength?: number;
}>;

export type ZigbeePayloadDeviceDataRule =
  | ZigbeePayloadNumericRule
  | ZigbeePayloadBooleanRule
  | ZigbeePayloadStringRule;

export const ZIGBEE_PAYLOAD_DEVICE_DATA_RULES: readonly ZigbeePayloadDeviceDataRule[] =
  [
    {
      kind: 'number',
      capability: 'battery',
      attribute: 'level',
      sources: ['battery'],
      unit: '%',
    },
    {
      kind: 'boolean',
      capability: 'battery',
      attribute: 'low',
      sources: ['battery_low'],
    },
    {
      kind: 'number',
      capability: 'zigbee',
      attribute: 'linkquality',
      sources: ['linkquality'],
    },
    {
      kind: 'boolean',
      capability: 'occupancy',
      attribute: 'motion',
      sources: ['occupancy', 'motion'],
    },
    {
      kind: 'boolean',
      capability: 'tamper',
      attribute: 'active',
      sources: ['tamper'],
    },
    {
      kind: 'number',
      capability: 'power',
      attribute: 'voltage',
      sources: ['voltage'],
      unit: 'mV',
    },
    {
      kind: 'number',
      capability: 'temperature',
      sources: ['temperature', 'device_temperature', 'local_temperature'],
      unit: '°C',
    },
    {
      kind: 'number',
      capability: 'climate',
      attribute: 'humidity',
      sources: ['humidity'],
      unit: '%',
    },
    {
      kind: 'number',
      capability: 'light',
      attribute: 'brightness',
      sources: ['brightness'],
    },
    {
      kind: 'number',
      capability: 'climate',
      attribute: 'pressure',
      sources: ['pressure'],
      unit: 'hPa',
    },
    {
      kind: 'number',
      capability: 'illuminance',
      attribute: 'value',
      sources: ['illuminance'],
      unit: 'lx',
    },
    {
      kind: 'string',
      capability: 'switch',
      attribute: 'state',
      sources: ['state'],
      minLength: 1,
    },
    {
      kind: 'boolean',
      capability: 'contact',
      attribute: 'open',
      sources: ['contact'],
    },
    {
      kind: 'boolean',
      capability: 'water_leak',
      attribute: 'detected',
      sources: ['water_leak'],
    },
  ];
