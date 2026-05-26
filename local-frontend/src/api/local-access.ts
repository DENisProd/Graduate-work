/**
 * API client for access-control endpoints on the LOCAL Rust server (/api/v1).
 * Uses `api` (local-server), NOT `accessApi` (cloud NestJS access-service).
 */
import { api } from './client'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LocalHouse {
  id: string
  name: string
  avatarUrl?: string
  address?: string
  conflictStrategy: string
  ownerId: string
  createdAt: string
  updatedAt: string
}

export interface LocalMember {
  id: string
  houseId: string
  userId: string
  externalUserId: string | null
  joinedAt: string
  removedAt: string | null
}

export interface LocalRole {
  id: string
  name: string
  priority: number
  isSystem: boolean
  houseId: string
  createdAt: string
  updatedAt: string
}

export interface LocalRoom {
  id: string
  name: string
  houseId: string
}

// ── Houses ────────────────────────────────────────────────────────────────────

export async function listLocalHouses(userId?: string): Promise<LocalHouse[]> {
  const { data } = await api.get<LocalHouse[]>('/api/v1/houses', {
    params: userId ? { userId } : undefined,
  })
  return data
}

// ── Members ───────────────────────────────────────────────────────────────────

export async function listLocalMembers(houseId: string): Promise<LocalMember[]> {
  const { data } = await api.get<LocalMember[]>(`/api/v1/houses/${houseId}/members`)
  return data
}

export async function addLocalMember(houseId: string, externalUserId: string): Promise<LocalMember> {
  const { data } = await api.post<LocalMember>(`/api/v1/houses/${houseId}/members`, {
    externalUserId,
  })
  return data
}

export async function removeLocalMember(houseId: string, memberId: string): Promise<void> {
  await api.delete(`/api/v1/houses/${houseId}/members/${memberId}`)
}

// ── Roles ─────────────────────────────────────────────────────────────────────

export async function listLocalRoles(houseId: string): Promise<LocalRole[]> {
  const { data } = await api.get<LocalRole[]>(`/api/v1/houses/${houseId}/roles`)
  return data
}

export async function createLocalRole(houseId: string, name: string, priority = 0): Promise<LocalRole> {
  const { data } = await api.post<LocalRole>(`/api/v1/houses/${houseId}/roles`, { name, priority })
  return data
}

export async function deleteLocalRole(id: string): Promise<void> {
  await api.delete(`/api/v1/house-roles/${id}`)
}

// ── Member-Role assignments ───────────────────────────────────────────────────

export async function listMemberRoles(memberId: string): Promise<LocalRole[]> {
  const { data } = await api.get<LocalRole[]>(`/api/v1/house-members/${memberId}/roles`)
  return data
}

export async function assignLocalRole(memberId: string, roleId: string): Promise<void> {
  await api.post(`/api/v1/house-members/${memberId}/roles`, { roleId })
}

export async function unassignLocalRole(memberId: string, roleId: string): Promise<void> {
  await api.delete(`/api/v1/house-members/${memberId}/roles/${roleId}`)
}

// ── Rooms ─────────────────────────────────────────────────────────────────────

export async function listLocalRooms(houseId: string): Promise<LocalRoom[]> {
  const { data } = await api.get<LocalRoom[]>(`/api/v1/houses/${houseId}/rooms`)
  return data
}

export async function createLocalRoom(houseId: string, name: string): Promise<LocalRoom> {
  const { data } = await api.post<LocalRoom>(`/api/v1/houses/${houseId}/rooms`, { name })
  return data
}

export async function updateLocalRoom(id: string, name: string): Promise<LocalRoom> {
  const { data } = await api.put<LocalRoom>(`/api/v1/house-rooms/${id}`, { name })
  return data
}

export async function deleteLocalRoom(id: string): Promise<void> {
  await api.delete(`/api/v1/house-rooms/${id}`)
}
