import { api } from './client'
import type { PhysicalDevice } from '@/types'
import type { PaginatedResponse } from './system'

interface ListFilters {
  houseId?: string
  roomId?: string
  page?: number
  size?: number
}

export async function listPhysicalDevices(
  filters: ListFilters = {},
): Promise<PaginatedResponse<PhysicalDevice>> {
  const { page = 0, size = 20 } = filters
  const { data } = await api.get<PaginatedResponse<PhysicalDevice> | PhysicalDevice[]>(
    '/api/v1/physical-devices',
    { params: { page, size, ...filters } },
  )
  if (Array.isArray(data)) {
    return {
      content: data,
      totalElements: data.length,
      totalPages: data.length === 0 ? 0 : 1,
      page,
      size,
    }
  }
  return data
}

export async function getPhysicalDevice(id: string): Promise<PhysicalDevice> {
  const { data } = await api.get<PhysicalDevice>(`/api/v1/physical-devices/${id}`)
  return data
}

export async function updatePhysicalDevice(
  id: string,
  body: Partial<
    Pick<PhysicalDevice, 'name' | 'description' | 'houseId' | 'roomId' | 'deviceCategoryId'>
  >,
): Promise<PhysicalDevice> {
  const { data } = await api.patch<PhysicalDevice>(`/api/v1/physical-devices/${id}`, body)
  return data
}
