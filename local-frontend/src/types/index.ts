export interface PhysicalDevice {
  id: string
  name: string
  description?: string
  protocolAddress: string
  networkAddress?: number
  type: 'Coordinator' | 'Router' | 'EndDevice'
  manufacturerName?: string
  model?: string
  friendlyName?: string
  firmwareVersion?: string
  deviceId?: number
  deviceCategoryId?: number
  houseId?: string
  roomId?: string
  capabilities: string[]
  lastSeen?: string
}

export interface ZigbeeState {
  id?: string
  deviceIeeeAddr: string
  timestamp: string
  payload: Record<string, unknown>
  state?: 'ON' | 'OFF'
  brightness?: number
  temperature?: number
  humidity?: number
  battery?: number
  occupancy?: boolean
  linkquality?: number
  colorMode?: string
}

export interface PairingEvent {
  type: 'device_found' | 'device_joined' | 'device_leave' | 'interview_started' | 'interview_successful' | 'interview_failed'
  ieeeAddr?: string
  model?: string
  manufacturerName?: string
  friendlyName?: string
  message?: string
  timestamp: string
}

export interface ZigbeeDevice {
  id: string
  ieeeAddr: string
  networkAddr: number
  friendlyName?: string
  model?: string
  manufacturerName?: string
  type: 'Coordinator' | 'Router' | 'EndDevice'
  firmwareVersion?: string
  powerSource?: string
  interviewCompleted: boolean
  lastSeen?: string
  definition?: Record<string, unknown>
}

export interface DeviceType {
  id: number
  code: string
  translations: { en: { name: string }; ru?: { name: string } }
}

export interface DeviceCategory {
  id: number
  code: string
  deviceTypeId: number
  translations: { en: { name: string; description?: string } }
}

export interface CatalogDevice {
  id: number
  code: string
  status: 'ONLINE' | 'OFFLINE'
  deviceCategoryId: number
  serialNumber?: string
  firmwareVersion?: string
  lastSeenAt?: string
  translations: { en: { name: string; description?: string } }
}

export interface DeviceFunction {
  id: number
  deviceId: number
  code: string
  dataType: string
  writable: boolean
  minValue?: number
  maxValue?: number
  unit?: string
  currentValue?: unknown
}

export interface ScenarioTrigger {
  type: 'device_state' | 'schedule' | 'manual'
  deviceId?: string
  condition?: string
  cron?: string
}

export interface ScenarioAction {
  type: 'zigbee_command' | 'log_message'
  deviceId?: string
  payload?: Record<string, unknown>
  message?: string
}

export interface ScenarioDefinition {
  triggers: ScenarioTrigger[]
  conditions?: unknown[]
  actions: ScenarioAction[]
}

export interface Scenario {
  id: string
  name: string
  description?: string
  houseId?: string
  creatorId?: string
  definition: ScenarioDefinition
  status: 'ONLINE' | 'OFFLINE' | 'ERROR'
  createdAt: string
  updatedAt: string
}

export interface ScenarioExecution {
  id: string
  scenarioId: string
  scenarioName?: string
  triggeredAt: string
  finishedAt?: string
  status: 'RUNNING' | 'SUCCESS' | 'FAILED' | 'SKIPPED'
  triggerType: string
  logs?: string[]
  error?: string
}

export interface ModbusDevice {
  id: string
  name: string
  slaveId: number
  description?: string
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface ModbusRegister {
  id: string
  deviceId: string
  name: string
  registerType: 'holding' | 'input' | 'coil' | 'discrete'
  address: number
  count: number
  unit?: string
  scaleFactor: number
  offset: number
  writable: boolean
  createdAt: string
  updatedAt: string
}

export interface ModbusRegisterState {
  registerId: string
  rawValues: number[]
  scaledValues: number[]
  timestamp: string
}

export interface ScanLogDevice {
  slaveId: number
  baudRate: number
  coils: number
  discreteInputs: number
  holdingRegisters: number
  inputRegisters: number
  isNew: boolean
  name: string
}

export interface ScanLogEntry {
  timestamp: string
  found: number
  registered: number
  devices: ScanLogDevice[]
}

export interface House {
  id: string
  name: string
  avatarUrl?: string
  address?: string
  ownerId: string
  conflictStrategy: 'DENY_OVERRIDES' | 'PERMIT_OVERRIDES' | 'LAST_WRITE_WINS'
}

export interface HouseRole {
  id: string
  houseId: string
  name: string
  isOwner: boolean
}

export interface HouseMember {
  id: string
  houseId: string
  userId: string
  joinedAt: string
  roles: HouseRole[]
}

export interface HouseInvitation {
  id: string
  houseId: string
  token: string
  createdAt: string
  expiresAt?: string
  createdBy?: string
}
