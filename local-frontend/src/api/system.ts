import { api } from './client'

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error'
  version: string
  db: string
}

export interface SyncStatus {
  pendingOutbox: number
  lastPulledAt: string | null
  lastPushedAt: string | null
}

export interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  page: number
  size: number
}

export async function getHealth(): Promise<HealthResponse> {
  const { data } = await api.get<HealthResponse>('/api/v1/system/health')
  return data
}

export async function getSyncStatus(): Promise<SyncStatus> {
  const { data } = await api.get<SyncStatus>('/system/sync/status')
  return data
}

export interface UpdateCheckResult {
  hasUpdate: boolean
  latestVersion?: string
  releaseNotes?: string
  downloadUrl?: string
}

export async function checkUpdate(): Promise<UpdateCheckResult> {
  const { data } = await api.post<UpdateCheckResult>('/api/v1/system/update/check')
  return data
}

export async function applyUpdate(): Promise<void> {
  await api.post('/api/v1/system/update/apply')
}

export async function getPhysicalDevicesCount(): Promise<number> {
  const { data } = await api.get<PaginatedResponse<unknown>>('/api/v1/physical-devices', {
    params: { page: 0, size: 1 },
  })
  return data.totalElements
}

export async function getZigbeeDevicesCount(): Promise<number> {
  const { data } = await api.get<unknown[]>('/api/v1/zigbee/devices')
  return Array.isArray(data) ? data.length : 0
}

export async function getScenariosCount(): Promise<number> {
  const { data } = await api.get<PaginatedResponse<unknown>>('/api/v1/scenarios', {
    params: { page: 0, size: 1 },
  })
  return data.totalElements
}
