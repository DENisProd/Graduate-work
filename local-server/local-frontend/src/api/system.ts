import { api } from './client'

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error'
  version: string
  db: string
  mqttConnected?: boolean
}

export interface SyncStatus {
  pendingOutbox: number
  lastPulledAt: string | null
  lastPushedAt: string | null
}

export interface RuntimeSettingsResponse {
  mqttUrl: string | null
  accessServiceUrl: string
  mqttConnected: boolean
  authSessionId: string | null
  authStatus: string | null
  authCode: string | null
  authExternalUserId: string | null
  authDisplayName: string | null
  authExpiresAt: string | null
}

export interface UpdateRuntimeSettingsRequest {
  accessServiceUrl?: string | null
}

export interface StartAuthResponse {
  authSessionId: string
  userCode: string
  verificationUrl: string
  expiresIn: number
  pollInterval: number
}

export interface AuthStatusResponse {
  authSessionId: string
  status: 'pending' | 'authorized' | 'expired' | 'denied' | 'logged_out'
  authCode: string | null
  externalUserId?: string | null
  displayName?: string | null
}

export interface CompleteAuthRequest {
  userCode: string
  externalUserId: string
  displayName?: string
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
  const { data } = await api.get<SyncStatus>('/api/v1/system/sync/status')
  return data
}

export interface SyncReport {
  housesUpserted: number
  roomsUpserted: number
}

export async function triggerSync(): Promise<SyncReport> {
  const { data } = await api.post<SyncReport>('/api/v1/system/sync')
  return data
}

export async function getRuntimeSettings(): Promise<RuntimeSettingsResponse> {
  const { data } = await api.get<RuntimeSettingsResponse>('/api/v1/system/settings')
  return data
}

export async function updateRuntimeSettings(
  body: UpdateRuntimeSettingsRequest,
): Promise<RuntimeSettingsResponse> {
  const { data } = await api.patch<RuntimeSettingsResponse>('/api/v1/system/settings', body)
  return data
}

export async function startDeviceAuthorization(): Promise<StartAuthResponse> {
  const { data } = await api.post<StartAuthResponse>('/api/v1/system/auth/start')
  return data
}

export async function getDeviceAuthorizationStatus(): Promise<AuthStatusResponse> {
  const { data } = await api.get<AuthStatusResponse>('/api/v1/system/auth/status')
  return data
}

export async function completeDeviceAuthorization(body: CompleteAuthRequest): Promise<void> {
  await api.post('/api/v1/system/auth/complete', body)
}

export async function logoutDeviceAuthorization(): Promise<void> {
  await api.post('/api/v1/system/auth/logout')
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
  const { data } = await api.get<PaginatedResponse<unknown> | unknown[]>(
    '/api/v1/physical-devices',
    { params: { page: 0, size: 1 } },
  )
  if (Array.isArray(data)) return data.length
  return data?.totalElements ?? 0
}

export async function getZigbeeDevicesCount(): Promise<number> {
  const { data } = await api.get<unknown[]>('/api/v1/zigbee/devices')
  return Array.isArray(data) ? data.length : 0
}

export async function getScenariosCount(): Promise<number> {
  const { data } = await api.get<PaginatedResponse<unknown> | unknown[]>(
    '/api/v1/scenarios',
    { params: { page: 0, size: 1 } },
  )
  if (Array.isArray(data)) return data.length
  return data?.totalElements ?? 0
}
