import { api } from './client'
import type { ZigbeeDevice, ZigbeeState } from '@/types'

export async function listZigbeeDevices(): Promise<ZigbeeDevice[]> {
  const { data } = await api.get<ZigbeeDevice[]>('/api/v1/zigbee/devices')
  return data
}

export async function getZigbeeDevice(ieeeAddr: string): Promise<ZigbeeDevice> {
  const { data } = await api.get<ZigbeeDevice>(`/api/v1/zigbee/devices/${ieeeAddr}`)
  return data
}

export async function sendCommand(
  ieeeAddr: string,
  payload: Record<string, unknown>,
): Promise<void> {
  await api.post(`/api/v1/zigbee/devices/${ieeeAddr}/command`, { payload })
}

export async function permitJoin(): Promise<void> {
  await api.post('/api/v1/zigbee/permit-join')
}

export async function syncFromBridge(): Promise<{ count?: number }> {
  const { data } = await api.post<{ count?: number }>('/api/v1/zigbee/devices/sync-from-bridge')
  return data ?? {}
}

export async function deleteZigbeeDevice(ieeeAddr: string): Promise<void> {
  await api.delete(`/api/v1/zigbee/devices/${ieeeAddr}`)
}

export async function getZigbeeStates(
  ieeeAddr?: string,
  limit?: number,
): Promise<ZigbeeState[]> {
  const { data } = await api.get<ZigbeeState[]>('/api/v1/zigbee/states', {
    params: {
      ...(ieeeAddr ? { ieeeAddr } : {}),
      ...(limit ? { limit } : {}),
    },
  })
  return data
}

export async function getDeviceLogs(
  ieeeAddr?: string,
  from?: string,
  to?: string,
): Promise<unknown[]> {
  const { data } = await api.get('/api/v1/zigbee/device-logs', {
    params: { ieeeAddr, from, to },
  })
  return data
}
