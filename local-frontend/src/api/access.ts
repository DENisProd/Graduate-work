import { api } from './client'
import type { House, HouseMember, HouseRole, HouseInvitation } from '@/types'

// ── Houses ────────────────────────────────────────────────────────────────────

export async function listUserHouses(userId: string): Promise<House[]> {
  const { data } = await api.get<House[]>(`/api/v1/houses/user/${userId}`)
  return data
}

export async function getHouse(id: string): Promise<House> {
  const { data } = await api.get<House>(`/api/v1/houses/${id}`)
  return data
}

export async function createHouse(body: {
  name: string
  address?: string
  avatarUrl?: string
}): Promise<House> {
  const { data } = await api.post<House>('/api/v1/houses', body)
  return data
}

export async function deleteHouse(id: string): Promise<void> {
  await api.delete(`/api/v1/houses/${id}`)
}

// ── Members ───────────────────────────────────────────────────────────────────

export async function listHouseMembers(houseId: string): Promise<HouseMember[]> {
  const { data } = await api.get<HouseMember[]>(`/api/v1/house-members/house/${houseId}`)
  return data
}

export async function addHouseMember(houseId: string, userId: string): Promise<HouseMember> {
  const { data } = await api.post<HouseMember>('/api/v1/house-members', null, {
    params: { houseId, userId },
  })
  return data
}

export async function removeHouseMember(houseId: string, userId: string): Promise<void> {
  await api.delete('/api/v1/house-members', { params: { houseId, userId } })
}

// ── Roles ─────────────────────────────────────────────────────────────────────

export async function listHouseRoles(houseId: string): Promise<HouseRole[]> {
  const { data } = await api.get<HouseRole[]>(`/api/v1/house-roles/house/${houseId}`)
  return data
}

export async function createHouseRole(houseId: string, name: string): Promise<HouseRole> {
  const { data } = await api.post<HouseRole>(`/api/v1/house-roles/house/${houseId}`, { name })
  return data
}

export async function assignRole(memberId: string, roleId: string): Promise<void> {
  await api.post(`/api/v1/house-roles/members/${memberId}/roles/${roleId}`)
}

export async function removeRole(memberId: string, roleId: string): Promise<void> {
  await api.delete(`/api/v1/house-roles/members/${memberId}/roles/${roleId}`)
}

// ── Invitations ───────────────────────────────────────────────────────────────

export async function listInvitations(houseId: string): Promise<HouseInvitation[]> {
  const { data } = await api.get<HouseInvitation[]>(`/api/v1/house-invitations/house/${houseId}`)
  return data
}

export async function createInvitation(houseId: string): Promise<HouseInvitation> {
  const { data } = await api.post<HouseInvitation>('/api/v1/house-invitations', { houseId })
  return data
}

export async function revokeInvitation(id: string): Promise<void> {
  await api.post(`/api/v1/house-invitations/${id}/revoke`)
}
