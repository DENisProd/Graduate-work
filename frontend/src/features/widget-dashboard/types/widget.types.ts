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
  | 'MINI_LINE_CHART'
  | 'MODBUS_REGISTER_VALUE'
  | 'MODBUS_REGISTER_CONTROL';

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
  ieeeAddr?: string;
  label: string;
  commandPayload: Record<string, unknown>;
  buttonStyle: 'primary' | 'danger' | 'ghost';
  confirmRequired?: boolean;
}

export interface ControlToggleConfig {
  type: 'CONTROL_TOGGLE';
  physicalDeviceId: string;
  ieeeAddr?: string;
  label: string;
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

export interface GaugeDialConfig {
  type: 'GAUGE_DIAL';
  physicalDeviceId: string;
  payloadKey: string;
  label?: string;
  unit?: string;
  min: number;
  max: number;
  warnAt?: number;
  criticalAt?: number;
  chips?: string[];
  accent: 'green' | 'blue' | 'amber' | 'red';
}

export interface CircularProgressConfig {
  type: 'CIRCULAR_PROGRESS';
  physicalDeviceId?: string;
  payloadKey?: string;
  title: string;
  subtitle?: string;
  staticValue?: number;
  max: number;
  unit?: string;
  badge?: string;
  accent: 'green' | 'blue' | 'amber' | 'red';
}

export interface SliderControlConfig {
  type: 'SLIDER_CONTROL';
  physicalDeviceId: string;
  ieeeAddr?: string;
  label: string;
  payloadKey: string;
  commandKey?: string;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  subtitle?: string;
  accent: 'green' | 'blue' | 'amber';
}

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
  icon: 'camera' | 'lightbulb' | 'fan' | 'lock' | 'speaker' | 'sparkles' | 'thermometer' | 'broom';
  showToggle: boolean;
  togglePayloadKey?: string;
  onPayload?: Record<string, unknown>;
  offPayload?: Record<string, unknown>;
  chips?: string[];
  stats?: DeviceHeroStat[];
  accent: 'green' | 'blue' | 'amber' | 'slate';
}

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

export interface ModbusRegisterValueConfig {
  type: 'MODBUS_REGISTER_VALUE';
  modbusDeviceId: string;
  modbusRegisterId: string;
  label?: string;
  unit?: string;
  refreshInterval: number;
  accent: 'green' | 'blue' | 'amber' | 'red';
}

export interface ModbusRegisterControlConfig {
  type: 'MODBUS_REGISTER_CONTROL';
  modbusDeviceId: string;
  modbusRegisterId: string;
  label?: string;
  controlType: 'coil' | 'holding';
  accent: 'green' | 'blue' | 'amber';
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
  | MiniLineChartConfig
  | ModbusRegisterValueConfig
  | ModbusRegisterControlConfig;

export interface WidgetInstance {
  id: string;
  type: WidgetType;
  config: WidgetConfig;
}

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

export interface WidgetMeta {
  type: WidgetType;
  label: string;
  description: string;
  icon: string;
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
  defaultConfig: Omit<WidgetConfig, 'type'>;
}

export interface WidgetTemplate {
  id: string;
  type: WidgetType;
  label: string;
  description: string;
  icon: string;
  accent: 'green' | 'blue' | 'amber' | 'red' | 'slate';
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
  config: Omit<WidgetConfig, 'type'>;
}
