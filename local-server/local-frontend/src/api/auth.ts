/**
 * Local password authentication against the LOCAL Rust server (/api/v1/auth).
 * Users are pulled from the cloud on sync and issued the default password "0000".
 * Distinct from the cloud device-authorization flow in `system.ts`.
 */
import { api } from './client'

export interface LocalAuthUser {
  id: string
  externalUserId: string
  displayName: string | null
  avatarUrl: string | null
  mustChangePassword: boolean
  isOwner: boolean
}

/** Users available for login (lazily issued the default password on the server). */
export async function listAuthUsers(): Promise<LocalAuthUser[]> {
  const { data } = await api.get<LocalAuthUser[]>('/api/v1/auth/users')
  return data
}

export async function login(userId: string, password: string): Promise<LocalAuthUser> {
  const { data } = await api.post<LocalAuthUser>('/api/v1/auth/login', { userId, password })
  return data
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<LocalAuthUser> {
  const { data } = await api.post<LocalAuthUser>('/api/v1/auth/change-password', {
    userId,
    currentPassword,
    newPassword,
  })
  return data
}
