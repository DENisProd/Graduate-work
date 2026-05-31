import { accessApi } from './access-client'
import type { House, HouseMember, HouseRole, HouseInvitation } from '@/types'

// ── Houses ────────────────────────────────────────────────────────────────────

export async function listUserHouses(userId: string): Promise<House[]> {
  const { data } = await accessApi.get<House[]>(`/api/access/v1/houses/user/${userId}`)
  return data
}

export async function getHouse(id: string): Promise<House> {
  const { data } = await accessApi.get<House>(`/api/access/v1/houses/${id}`)
  return data
}

export async function createHouse(body: {
  name: string
  address?: string
  avatarUrl?: string
}): Promise<House> {
  const { data } = await accessApi.post<House>('/api/access/v1/houses', body)
  return data
}

export async function deleteHouse(id: string): Promise<void> {
  await accessApi.delete(`/api/access/v1/houses/${id}`)
}

// ── Members ───────────────────────────────────────────────────────────────────

export async function listHouseMembers(houseId: string): Promise<HouseMember[]> {
  const { data } = await accessApi.get<HouseMember[]>(`/api/access/v1/house-members/house/${houseId}`)
  return data
}

export async function addHouseMember(houseId: string, userId: string): Promise<HouseMember> {
  const { data } = await accessApi.post<HouseMember>('/api/access/v1/house-members', null, {
    params: { houseId, userId },
  })
  return data
}

export async function removeHouseMember(houseId: string, userId: string): Promise<void> {
  await accessApi.delete('/api/access/v1/house-members', { params: { houseId, userId } })
}

// ── Roles ─────────────────────────────────────────────────────────────────────

export async function listHouseRoles(houseId: string): Promise<HouseRole[]> {
  const { data } = await accessApi.get<HouseRole[]>(`/api/access/v1/house-roles/house/${houseId}`)
  return data
}

export async function createHouseRole(houseId: string, name: string): Promise<HouseRole> {
  const { data } = await accessApi.post<HouseRole>(`/api/access/v1/house-roles/house/${houseId}`, { name })
  return data
}

export async function assignRole(memberId: string, roleId: string): Promise<void> {
  await accessApi.post(`/api/access/v1/house-roles/members/${memberId}/roles/${roleId}`)
}

export async function removeRole(memberId: string, roleId: string): Promise<void> {
  await accessApi.delete(`/api/access/v1/house-roles/members/${memberId}/roles/${roleId}`)
}

// ── Invitations ───────────────────────────────────────────────────────────────

export async function listInvitations(houseId: string): Promise<HouseInvitation[]> {
  const { data } = await accessApi.get<HouseInvitation[]>(`/api/access/v1/house-invitations/house/${houseId}`)
  return data
}

export async function createInvitation(houseId: string): Promise<HouseInvitation> {
  const { data } = await accessApi.post<HouseInvitation>('/api/access/v1/house-invitations', { houseId })
  return data
}

export async function revokeInvitation(id: string): Promise<void> {
  await accessApi.post(`/api/access/v1/house-invitations/${id}/revoke`)
}
