export type WidgetType =
  | 'TELEMETRY_VALUE'
  | 'DEVICE_STATUS'
  | 'CONTROL_BUTTON'
  | 'CONTROL_TOGGLE'
  | 'SCENARIO_TRIGGER'
  | 'TEXT_LABEL';

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

export type WidgetConfig =
  | TelemetryValueConfig
  | DeviceStatusConfig
  | ControlButtonConfig
  | ControlToggleConfig
  | ScenarioTriggerConfig
  | TextLabelConfig;

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
