import { api } from './client'
import type { ModbusDevice, ModbusRegister, ModbusRegisterState, ScanLogEntry } from '@/types'

// ─── Devices ──────────────────────────────────────────────────────────────────

export async function listModbusDevices(): Promise<ModbusDevice[]> {
  const { data } = await api.get<ModbusDevice[]>('/api/v1/modbus/devices')
  return data
}

export async function getModbusDevice(id: string): Promise<ModbusDevice> {
  const { data } = await api.get<ModbusDevice>(`/api/v1/modbus/devices/${id}`)
  return data
}

export interface CreateModbusDeviceBody {
  name: string
  slaveId: number
  description?: string
  enabled?: boolean
}

export async function createModbusDevice(body: CreateModbusDeviceBody): Promise<ModbusDevice> {
  const { data } = await api.post<ModbusDevice>('/api/v1/modbus/devices', body)
  return data
}

export async function deleteModbusDevice(id: string): Promise<void> {
  await api.delete(`/api/v1/modbus/devices/${id}`)
}

// ─── Registers ────────────────────────────────────────────────────────────────

export async function listModbusRegisters(deviceId: string): Promise<ModbusRegister[]> {
  const { data } = await api.get<ModbusRegister[]>(`/api/v1/modbus/devices/${deviceId}/registers`)
  return data
}

export interface CreateModbusRegisterBody {
  name: string
  registerType: 'holding' | 'input' | 'coil' | 'discrete'
  address: number
  count?: number
  unit?: string
  scaleFactor?: number
  offset?: number
  writable?: boolean
}

export async function createModbusRegister(
  deviceId: string,
  body: CreateModbusRegisterBody,
): Promise<ModbusRegister> {
  const { data } = await api.post<ModbusRegister>(
    `/api/v1/modbus/devices/${deviceId}/registers`,
    body,
  )
  return data
}

export async function deleteModbusRegister(deviceId: string, registerId: string): Promise<void> {
  await api.delete(`/api/v1/modbus/devices/${deviceId}/registers/${registerId}`)
}

export interface UpdateModbusRegisterBody {
  name?: string
  registerType?: 'holding' | 'input' | 'coil' | 'discrete'
  address?: number
  count?: number
  unit?: string
  scaleFactor?: number
  offset?: number
  writable?: boolean
}

export async function updateModbusRegister(
  deviceId: string,
  registerId: string,
  body: UpdateModbusRegisterBody,
): Promise<ModbusRegister> {
  const { data } = await api.patch<ModbusRegister>(
    `/api/v1/modbus/devices/${deviceId}/registers/${registerId}`,
    body,
  )
  return data
}

// ─── Read / Write ─────────────────────────────────────────────────────────────

export async function readModbusRegister(
  deviceId: string,
  registerId: string,
): Promise<ModbusRegisterState> {
  const { data } = await api.post<ModbusRegisterState>(
    `/api/v1/modbus/devices/${deviceId}/registers/${registerId}/read`,
  )
  return data
}

export interface WriteModbusRegisterBody {
  value?: number
  values?: number[]
  coil?: boolean
  /** Engineering value — backend converts using scale/offset */
  scaledValue?: number
}

export async function writeModbusRegister(
  deviceId: string,
  registerId: string,
  body: WriteModbusRegisterBody,
): Promise<void> {
  await api.post(`/api/v1/modbus/devices/${deviceId}/registers/${registerId}/write`, body)
}

export async function getDeviceState(deviceId: string): Promise<ModbusRegisterState[]> {
  const { data } = await api.get<ModbusRegisterState[]>(
    `/api/v1/modbus/devices/${deviceId}/state`,
  )
  return data
}

// ─── Scan ──────────────────────────────────────────────────────────────────────

export async function getScanLog(): Promise<ScanLogEntry[]> {
  const { data } = await api.get<ScanLogEntry[]>('/api/v1/modbus/scan-log')
  return data
}

export async function triggerScan(): Promise<void> {
  await api.post('/api/v1/modbus/scan')
}
