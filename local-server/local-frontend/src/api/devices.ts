import { api } from './client'
import type { DeviceType, DeviceCategory, CatalogDevice, DeviceFunction } from '@/types'

export async function listDeviceTypes(): Promise<DeviceType[]> {
  const { data } = await api.get<DeviceType[]>('/api/v1/device-types')
  return data
}

export async function listDeviceCategories(): Promise<DeviceCategory[]> {
  const { data } = await api.get<DeviceCategory[]>('/api/v1/device-categories/all')
  return data
}

interface PagedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
}

interface DevicesParams {
  page?: number
  size?: number
}

export async function listDevices(
  params: DevicesParams = {},
): Promise<PagedResponse<CatalogDevice>> {
  const { data } = await api.get<PagedResponse<CatalogDevice>>('/api/v1/devices', { params })
  return data
}

export async function getDeviceDetailed(
  id: number,
): Promise<CatalogDevice & { functions?: DeviceFunction[] }> {
  const { data } = await api.get(`/api/v1/devices/${id}/detailed`)
  return data
}

export async function listDeviceFunctions(deviceId: number): Promise<DeviceFunction[]> {
  const { data } = await api.get<DeviceFunction[]>(
    `/api/v1/device-functions/by-device/${deviceId}/all`,
  )
  return data
}
