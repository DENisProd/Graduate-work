export type WidgetType =
  | 'TELEMETRY_VALUE'
  | 'DEVICE_STATUS'
  | 'CONTROL_BUTTON'
  | 'CONTROL_TOGGLE'
  | 'SCENARIO_TRIGGER'
  | 'TEXT_LABEL'
  | 'GAUGE_DIAL'
  | 'CIRCULAR_PROGRESS'
  | 'SLIDER_CONTROL'
  | 'DEVICE_HERO'
  | 'MINI_LINE_CHART';

export interface WidgetLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

// ──── Config types per widget ────────────────────────────────────────────────

export interface TelemetryValueConfig {
  type: 'TELEMETRY_VALUE';
  physicalDeviceId: string;
  /** Key in ZigbeeStateWire.payload or ZigbeeStateMetrics (e.g. "temperature", "state") */
  payloadKey: string;
  label?: string;
  unit?: string;
  displayVariant: 'numeric' | 'badge' | 'boolean';
}

export interface DeviceStatusConfig {
  type: 'DEVICE_STATUS';
  physicalDeviceId: string;
  label?: string;
  showLastSeen: boolean;
}

export interface ControlButtonConfig {
  type: 'CONTROL_BUTTON';
  physicalDeviceId: string;
  /** IEEE address for Socket.IO command */
  ieeeAddr?: string;
  label: string;
  /** Zigbee command payload, e.g. {"state": "ON"} */
  commandPayload: Record<string, unknown>;
  buttonStyle: 'primary' | 'danger' | 'ghost';
  confirmRequired?: boolean;
}

export interface ControlToggleConfig {
  type: 'CONTROL_TOGGLE';
  physicalDeviceId: string;
  ieeeAddr?: string;
  label: string;
  /** payload key to read ON/OFF state from */
  statePayloadKey: string;
  onPayload: Record<string, unknown>;
  offPayload: Record<string, unknown>;
}

export interface ScenarioTriggerConfig {
  type: 'SCENARIO_TRIGGER';
  scenarioId: string;
  label: string;
  buttonStyle: 'primary' | 'success' | 'danger';
  confirmRequired?: boolean;
}

export interface TextLabelConfig {
  type: 'TEXT_LABEL';
  text: string;
  align: 'left' | 'center' | 'right';
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  style: 'title' | 'subtitle' | 'body' | 'divider';
}

/** Semicircular gauge (climate-control style: min … current … max). */
export interface GaugeDialConfig {
  type: 'GAUGE_DIAL';
  physicalDeviceId: string;
  payloadKey: string;
  label?: string;
  unit?: string;
  /** Numerical range that bounds the gauge. */
  min: number;
  max: number;
  /** Optional warning/critical thresholds; coloring in the arc. */
  warnAt?: number;
  criticalAt?: number;
  /** Up to 3 short tags shown above the gauge (e.g. "Eco mode"). */
  chips?: string[];
  accent: 'green' | 'blue' | 'amber' | 'red';
}

/** Big circular progress ring with center percentage and a hero label. */
export interface CircularProgressConfig {
  type: 'CIRCULAR_PROGRESS';
  /** Optional device source — when set, value is read from telemetry. */
  physicalDeviceId?: string;
  payloadKey?: string;
  /** Display label like "Your home under control". */
  title: string;
  subtitle?: string;
  /** Static value when no device is bound (0…max). */
  staticValue?: number;
  max: number;
  unit?: string;
  /** Tag rendered inside the ring under the percentage. */
  badge?: string;
  accent: 'green' | 'blue' | 'amber' | 'red';
}

/** Slider control — reads payloadKey, writes commandKey, scaled to 0…max. */
export interface SliderControlConfig {
  type: 'SLIDER_CONTROL';
  physicalDeviceId: string;
  ieeeAddr?: string;
  label: string;
  /** Read current value from this payload key (e.g. "brightness"). */
  payloadKey: string;
  /** Send command using this key (defaults to payloadKey). */
  commandKey?: string;
  min: number;
  max: number;
  /** Step for slider; default 1. */
  step?: number;
  unit?: string;
  /** Optional companion subtitle: "Warm light". */
  subtitle?: string;
  accent: 'green' | 'blue' | 'amber';
}

/**
 * Rich device hero card — large icon, title, model/subtitle, ON/OFF toggle and
 * up to 3 stat rows (icon + value + caption) computed from telemetry keys.
 */
export interface DeviceHeroStat {
  key: string;
  icon: 'cube' | 'bolt' | 'clock' | 'droplet' | 'flame' | 'leaf';
  caption: string;
  unit?: string;
}

export interface DeviceHeroConfig {
  type: 'DEVICE_HERO';
  physicalDeviceId: string;
  ieeeAddr?: string;
  title: string;
  subtitle?: string;
  /** Lucide-style icon name we hand-render. */
  icon: 'camera' | 'lightbulb' | 'fan' | 'lock' | 'speaker' | 'sparkles' | 'thermometer' | 'broom';
  /** When true, header shows an ON/OFF toggle bound to togglePayloadKey. */
  showToggle: boolean;
  togglePayloadKey?: string;
  onPayload?: Record<string, unknown>;
  offPayload?: Record<string, unknown>;
  /** Up to 3 short tag chips ("Eco mode", "Vacuum + Mop"). */
  chips?: string[];
  /** Up to 3 mini-stats. */
  stats?: DeviceHeroStat[];
  accent: 'green' | 'blue' | 'amber' | 'slate';
}

/** Streaming mini line chart fed from Zigbee telemetry payload key. */
export interface MiniLineChartConfig {
  type: 'MINI_LINE_CHART';
  physicalDeviceId: string;
  payloadKey: string;
  title: string;
  unit?: string;
  /** History buffer size (number of points kept in memory). Default 60. */
  bufferSize?: number;
  accent: 'green' | 'blue' | 'amber' | 'red';
}

export type WidgetConfig =
  | TelemetryValueConfig
  | DeviceStatusConfig
  | ControlButtonConfig
  | ControlToggleConfig
  | ScenarioTriggerConfig
  | TextLabelConfig
  | GaugeDialConfig
  | CircularProgressConfig
  | SliderControlConfig
  | DeviceHeroConfig
  | MiniLineChartConfig;

// ──── Widget instance ─────────────────────────────────────────────────────────

export interface WidgetInstance {
  id: string;
  type: WidgetType;
  config: WidgetConfig;
}

// ──── Dashboard ───────────────────────────────────────────────────────────────

export interface WidgetDashboard {
  id: string;
  houseId: string;
  userId: string;
  name: string;
  isDefault: boolean;
  layouts: Record<string, WidgetLayout[]>;
  widgets: WidgetInstance[];
  createdAt: string;
  updatedAt: string;
}

// ──── Registry meta ──────────────────────────────────────────────────────────

export interface WidgetMeta {
  type: WidgetType;
  label: string;
  description: string;
  icon: string;
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
  defaultConfig: Omit<WidgetConfig, 'type'>;
}

/**
 * A preconfigured widget the user can drop in with one click.
 * Bridges visual templates (camera card, climate dial, energy chart) and the
 * underlying widget types — config is fully prefilled except for the device.
 */
export interface WidgetTemplate {
  /** Stable id; used as React key in the picker. */
  id: string;
  type: WidgetType;
  label: string;
  description: string;
  /** Lucide-style icon name. */
  icon: string;
  /** Visual accent for the picker tile. */
  accent: 'green' | 'blue' | 'amber' | 'red' | 'slate';
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
  /** Full prefilled config (sans `type`). */
  config: Omit<WidgetConfig, 'type'>;
}
