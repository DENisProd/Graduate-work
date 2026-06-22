'use client';

import type {
  HouseRequest,
  HouseResponse,
  HouseResourceTreeNode,
  HouseRoomRequest,
  HouseRoomResponse,
  HouseMemberResponse,
  HouseInvitationRequest,
  HouseInvitationResponse,
  HouseRoleResponse,
  HouseRoleCreateRequest,
  RoleMemberResponse,
  HousePolicyResponse,
  CreatePolicyRequestDto,
  CreateResourceRequestDto,
  ResourceResponseDto,
  CreateAccessRightDto,
  AccessRightResponse,
  AccessStructureResponse,
  HouseAccessRightRequestDto,
  HouseAccessRightResponse,
  AccessControlCheckRequestDto,
  AccessCheckResponse,
  PageRequest,
  PageResponse,
} from '@/types/api';
import { accessApiCall, buildPageQuery } from './core';

export interface DeviceAuthSessionStartResponse {
  authSessionId: string;
  userCode: string;
  verificationUrl: string;
  expiresIn: number;
  pollInterval: number;
}

export interface DeviceAuthPollResponse {
  status: 'pending' | 'authorized' | 'denied' | 'expired';
  authCode?: string;
  externalUserId?: string;
  displayName?: string;
}

export interface ConnectedLocalServerItem {
  id: string;
  status: 'pending' | 'authorized' | 'denied' | 'expired';
  userCode: string;
  displayName?: string;
  serialNumber?: string | null;
  externalUserId?: string;
  authorizedAt?: string | null;
  lastSeenAt?: string | null;
}

export const housesApi = {
  getById: (id: number | string): Promise<HouseResponse> =>
    accessApiCall(`/v1/houses/${id}`),

  getResourcesTree: (id: number | string): Promise<HouseResourceTreeNode | HouseResourceTreeNode[]> =>
    accessApiCall(`/v1/houses/${id}/resources/tree`),

  getPageAccess: (
    id: number | string,
  ): Promise<Record<string, { read: boolean; write: boolean }>> =>
    accessApiCall(`/v1/houses/${id}/page-access`),

  getFunctionAccess: (
    id: number | string,
  ): Promise<Record<string, { read: boolean; write: boolean }>> =>
    accessApiCall(`/v1/houses/${id}/function-access`),

  getByOwner: (ownerId: string, params?: PageRequest): Promise<HouseResponse[] | PageResponse<HouseResponse>> =>
    accessApiCall(`/v1/houses/user/${ownerId}${buildPageQuery(params)}`),

  getAllAdmin: (params?: PageRequest): Promise<HouseResponse[] | PageResponse<HouseResponse>> =>
    accessApiCall(`/v1/admin/houses${buildPageQuery(params)}`),

  getByOwnerAdmin: (ownerId: string, params?: PageRequest): Promise<HouseResponse[] | PageResponse<HouseResponse>> =>
    accessApiCall(`/v1/admin/houses/owner/${encodeURIComponent(ownerId)}${buildPageQuery(params)}`),

  create: (data: HouseRequest): Promise<HouseResponse> =>
    accessApiCall('/v1/houses', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: number | string, data: HouseRequest): Promise<HouseResponse> =>
    accessApiCall(`/v1/houses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: number | string): Promise<void> =>
    accessApiCall(`/v1/houses/${id}`, { method: 'DELETE' }),
};

function findResourceNodeByType(
  nodes: HouseResourceTreeNode[],
  type: string,
): HouseResourceTreeNode | null {
  for (const node of nodes) {
    if (node.type === type) return node;
    const found = findResourceNodeByType(node.children ?? [], type);
    if (found) return found;
  }
  return null;
}

async function resolveRoomParentId(data: HouseRoomRequest): Promise<number | string> {
  if (data.parentId != null) return data.parentId;
  const tree = await housesApi.getResourcesTree(data.houseId);
  const nodes = Array.isArray(tree) ? tree : [tree];
  const houseNode = findResourceNodeByType(nodes, 'HOUSE');
  if (!houseNode) throw new Error('HOUSE resource node was not found');
  return houseNode.id;
}

export const houseRoomsApi = {
  getById: (id: number | string): Promise<HouseRoomResponse> =>
    accessApiCall(`/v1/house-rooms/${id}`),

  getByHouseId: (houseId: number | string): Promise<HouseRoomResponse[]> =>
    accessApiCall(`/v1/house-rooms/house/${houseId}`),

  create: async (data: HouseRoomRequest): Promise<HouseRoomResponse> => {
    const houseId =
      typeof data.houseId === 'string' && /^\d+$/.test(data.houseId) ? Number(data.houseId) : data.houseId;
    return accessApiCall('/v1/house-rooms', {
      method: 'POST',
      body: JSON.stringify({ houseId, name: data.name }),
    });
  },

  update: (id: number | string, data: HouseRoomRequest): Promise<HouseRoomResponse> =>
    accessApiCall(`/v1/house-rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ houseId: data.houseId, name: data.name }),
    }),

  delete: (id: number | string): Promise<void> =>
    accessApiCall(`/v1/house-rooms/${id}`, { method: 'DELETE' }),
};

export const houseMembersApi = {
  getByHouseId: (
    houseId: number | string,
    params?: PageRequest,
  ): Promise<HouseMemberResponse[] | PageResponse<HouseMemberResponse>> =>
    accessApiCall(`/v1/house-members/house/${houseId}${buildPageQuery(params)}`),

  getHousesByUserId: (
    userId: string,
    params?: PageRequest,
  ): Promise<HouseResponse[] | PageResponse<HouseResponse>> =>
    accessApiCall(`/v1/houses/user/${userId}${buildPageQuery(params)}`),

  addMember: (houseId: number | string, userId: string): Promise<HouseMemberResponse> =>
    accessApiCall(
      `/v1/house-members?houseId=${encodeURIComponent(String(houseId))}&userId=${encodeURIComponent(userId)}`,
      { method: 'POST' },
    ),

  removeMember: (houseId: number | string, memberIdOrUserId: number | string): Promise<void> =>
    accessApiCall(
      `/v1/house-members?houseId=${encodeURIComponent(String(houseId))}&userId=${encodeURIComponent(String(memberIdOrUserId))}`,
      { method: 'DELETE' },
    ),
};

function mapRoleResponse(o: Record<string, unknown>): HouseRoleResponse {
  return {
    id: typeof o.id === 'string' ? o.id : String(o.id ?? o.roleId ?? ''),
    name: typeof o.name === 'string' ? o.name : undefined,
    code: typeof o.code === 'string' ? o.code : undefined,
    priority: typeof o.priority === 'number' ? o.priority : undefined,
    memberCount:
      typeof o.memberCount === 'number'
        ? o.memberCount
        : typeof o.usersCount === 'number'
          ? o.usersCount
          : undefined,
    system: o.system === true || o.isSystem === true,
    permissions: Array.isArray(o.permissions)
      ? o.permissions.filter((p): p is string => typeof p === 'string')
      : undefined,
  } as HouseRoleResponse;
}

function mapRolesArray(data: unknown): HouseRoleResponse[] {
  if (!Array.isArray(data)) return [];
  return data.map((item: unknown) => mapRoleResponse(item as Record<string, unknown>));
}

export const houseRolesApi = {
  getHouseRoles: async (houseId: number | string): Promise<HouseRoleResponse[]> => {
    try {
      const data = await accessApiCall<unknown>(
        `/v1/house-roles/house/${encodeURIComponent(String(houseId))}`,
      );
      return mapRolesArray(data);
    } catch {
      const fallback = await accessApiCall<unknown>(`/v1/houses/${houseId}/roles`);
      return mapRolesArray(fallback);
    }
  },

  /** @deprecated Use getHouseRoles */
  getByHouseId: (houseId: number | string): Promise<HouseRoleResponse[]> =>
    houseRolesApi.getHouseRoles(houseId),

  createRole: (houseId: number | string, data: HouseRoleCreateRequest): Promise<HouseRoleResponse> =>
    accessApiCall(`/v1/house-roles/house/${encodeURIComponent(String(houseId))}`, {
      method: 'POST',
      body: JSON.stringify({ name: data.name.trim(), priority: data.priority ?? 0 }),
    }).then((res: unknown) => mapRoleResponse(res as Record<string, unknown>)),

  updateRole: (roleId: number | string, data: HouseRoleCreateRequest): Promise<HouseRoleResponse> =>
    accessApiCall(`/v1/house-roles/${roleId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: data.name.trim(),
        ...(data.priority !== undefined && { priority: data.priority }),
      }),
    }).then((res: unknown) => mapRoleResponse(res as Record<string, unknown>)),

  deleteRole: (roleId: number | string): Promise<void> =>
    accessApiCall(`/v1/house-roles/${roleId}`, { method: 'DELETE' }),

  /**
   * List role members.
   * The old endpoint `/v1/house-roles/:roleId/members` was removed on backend.
   * We derive members via `/v1/house-members/house/:houseId` and filter by roleId.
   */
  getRoleMembers: async (
    houseId: number | string,
    roleId: number | string,
  ): Promise<RoleMemberResponse[]> => {
    const members = await accessApiCall<unknown>(
      `/v1/house-members/house/${encodeURIComponent(String(houseId))}`,
    );
    if (!Array.isArray(members)) return [];

    const roleIdStr = String(roleId);

    return members
      .map((item: unknown) => item as Record<string, unknown>)
      .filter((m) => {
        const roles = m.roles;
        if (!Array.isArray(roles)) return false;
        return roles.some((r) => String((r as Record<string, unknown>).roleId ?? '') === roleIdStr);
      })
      .map((m) => {
        return {
          id: typeof m.id === 'string' ? m.id : String(m.id ?? ''),
          userId: typeof m.userId === 'string' ? m.userId : undefined,
          name: typeof m.userDisplayName === 'string' ? m.userDisplayName : undefined,
          email: undefined,
          avatarUrl: typeof m.userAvatarUrl === 'string' ? m.userAvatarUrl : undefined,
        } as RoleMemberResponse;
      });
  },

  getHousePolicies: (houseId: number | string): Promise<HousePolicyResponse[]> =>
    accessApiCall(`/v1/houses/${encodeURIComponent(String(houseId))}/policies`).then(
      (data: unknown) => {
        if (!Array.isArray(data)) return [];
        return data.map((item: unknown) => {
          const o = item as Record<string, unknown>;
          return {
            id: typeof o.id === 'string' ? o.id : String(o.id ?? ''),
            name: typeof o.name === 'string' ? o.name : undefined,
            effect: typeof o.effect === 'string' ? o.effect : undefined,
            subjectType: typeof o.subjectType === 'string' ? o.subjectType : undefined,
            subjectId: typeof o.subjectId === 'string' ? o.subjectId : undefined,
            resourceId: typeof o.resourceId === 'string' ? o.resourceId : undefined,
            priority: typeof o.priority === 'number' ? o.priority : undefined,
            condition:
              o.condition && typeof o.condition === 'object'
                ? (o.condition as Record<string, unknown>)
                : undefined,
          } as HousePolicyResponse;
        });
      },
    ),

  createPolicy: (body: CreatePolicyRequestDto): Promise<HousePolicyResponse> =>
    accessApiCall('/v1/policies', { method: 'POST', body: JSON.stringify(body) }).then(
      (res: unknown) => {
        const o = res as Record<string, unknown>;
        return {
          id: typeof o.id === 'string' ? o.id : String(o.id ?? ''),
          name: typeof o.name === 'string' ? o.name : undefined,
          effect: typeof o.effect === 'string' ? o.effect : undefined,
          subjectType: typeof o.subjectType === 'string' ? o.subjectType : undefined,
          subjectId: typeof o.subjectId === 'string' ? o.subjectId : undefined,
          resourceId: typeof o.resourceId === 'string' ? o.resourceId : undefined,
          priority: typeof o.priority === 'number' ? o.priority : undefined,
          condition:
            o.condition && typeof o.condition === 'object'
              ? (o.condition as Record<string, unknown>)
              : undefined,
        } as HousePolicyResponse;
      },
    ),

  createResource: (body: CreateResourceRequestDto): Promise<ResourceResponseDto> =>
    accessApiCall('/v1/resources', { method: 'POST', body: JSON.stringify(body) }).then(
      (res: unknown) => {
        const o = res as Record<string, unknown>;
        return {
          id: typeof o.id === 'string' ? o.id : String(o.id ?? ''),
          type: typeof o.type === 'string' ? o.type : undefined,
          parentId: typeof o.parentId === 'string' ? o.parentId : undefined,
          name: typeof o.name === 'string' ? o.name : undefined,
          externalId: typeof o.externalId === 'string' ? o.externalId : undefined,
        } as ResourceResponseDto;
      },
    ),

  assignRoleToMember: (memberId: number | string, roleId: string): Promise<unknown> =>
    accessApiCall(`/v1/house-roles/members/${memberId}/roles/${roleId}`, { method: 'POST' }),

  removeRoleFromMember: (memberId: number | string, roleId: string): Promise<void> =>
    accessApiCall(`/v1/house-roles/members/${memberId}/roles/${roleId}`, { method: 'DELETE' }),

  getRolePermissions: (roleId: string): Promise<unknown> =>
    accessApiCall(`/v1/roles/${roleId}/permissions`),

  addRolePermission: (roleId: string, body: Record<string, unknown>): Promise<unknown> =>
    accessApiCall(`/v1/roles/${roleId}/permissions`, { method: 'POST', body: JSON.stringify(body) }),

  deleteRolePermission: (roleId: string, permissionId?: string): Promise<void> =>
    accessApiCall(
      `/v1/roles/${roleId}/permissions${permissionId ? `?permissionId=${encodeURIComponent(permissionId)}` : ''}`,
      { method: 'DELETE' },
    ),
};

export const houseInvitationsApi = {
  getByToken: (token: string): Promise<HouseInvitationResponse> =>
    accessApiCall(`/v1/house-invitations/token/${encodeURIComponent(token)}`),

  getByHouseId: (
    houseId: number | string,
    params?: PageRequest,
  ): Promise<HouseInvitationResponse[] | PageResponse<HouseInvitationResponse>> =>
    accessApiCall(`/v1/house-invitations/house/${houseId}${buildPageQuery(params)}`),

  create: (
    houseId: number | string,
    data: HouseInvitationRequest,
    userId: string,
  ): Promise<HouseInvitationResponse> =>
    accessApiCall('/v1/house-invitations', {
      method: 'POST',
      headers: { 'X-User-Id': userId },
      body: JSON.stringify({
        houseId: typeof houseId === 'string' && /^\d+$/.test(houseId) ? Number(houseId) : houseId,
        ...(data.note ? { note: data.note } : {}),
        ...(data.roleId ? { roleId: data.roleId } : {}),
        ...(data.permissions?.length ? { permissions: data.permissions } : {}),
        ...(data.accessRight ? { accessRight: data.accessRight } : {}),
        ...(data.expiresAt ? { expiresAt: data.expiresAt } : {}),
      }),
    }),

  accept: (token: string, userId: string): Promise<HouseInvitationResponse> =>
    accessApiCall(`/v1/house-invitations/${encodeURIComponent(token)}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
      body: JSON.stringify({ token, userId }),
    }),

  revoke: (id: number | string, userId: string): Promise<void> =>
    accessApiCall(`/v1/house-invitations/${id}/revoke`, {
      method: 'POST',
      headers: { 'X-User-Id': userId },
    }),
};

export const deviceAuthApi = {
  startSession: (callbackUrl?: string): Promise<DeviceAuthSessionStartResponse> =>
    accessApiCall('/v1/device-auth/sessions', {
      method: 'POST',
      body: JSON.stringify(callbackUrl ? { callbackUrl } : {}),
    }),

  pollSession: (sessionId: string): Promise<DeviceAuthPollResponse> =>
    accessApiCall(`/v1/device-auth/sessions/${encodeURIComponent(sessionId)}/poll`),

  listConnectedServers: (): Promise<ConnectedLocalServerItem[]> =>
    accessApiCall('/v1/device-auth/connected-servers'),

  confirm: (
    userCode: string,
    externalUserId: string,
    displayName?: string,
  ): Promise<{ status: string }> =>
    accessApiCall('/v1/device-auth/confirm', {
      method: 'POST',
      body: JSON.stringify({
        userCode,
        externalUserId,
        ...(displayName && displayName.trim().length > 0 ? { displayName: displayName.trim() } : {}),
      }),
    }),

  logoutSession: (sessionId: string): Promise<{ status: string }> =>
    accessApiCall(`/v1/device-auth/sessions/${encodeURIComponent(sessionId)}/logout`, {
      method: 'POST',
    }),
};

export function mapCreateAccessRightToHouseDomain(dto: CreateAccessRightDto): HouseAccessRightRequestDto {
  return {
    resourceId: dto.resourceId,
    ...(dto.houseMemberId ? { houseMemberId: dto.houseMemberId } : {}),
    ...(dto.roleId ? { houseRoleId: dto.roleId } : {}),
    accessRightType: dto.accessRightType,
    ...(dto.expiresAt ? { expiresAt: dto.expiresAt } : {}),
  };
}

export async function fetchAccessControlRightsByMember(
  memberId: string,
  params?: PageRequest,
): Promise<HouseAccessRightResponse[] | PageResponse<HouseAccessRightResponse>> {
  return accessApiCall(
    `/v1/access-control/rights/member/${encodeURIComponent(memberId)}${buildPageQuery(params)}`,
  );
}

export async function fetchAccessControlRightsByHouse(
  houseId: string,
  params?: PageRequest,
): Promise<HouseAccessRightResponse[] | PageResponse<HouseAccessRightResponse>> {
  return accessApiCall(
    `/v1/access-control/rights/house/${encodeURIComponent(houseId)}${buildPageQuery(params)}`,
  );
}

export const accessControlRightsApi = {
  create: (dto: HouseAccessRightRequestDto): Promise<HouseAccessRightResponse> =>
    accessApiCall('/v1/access-control/rights', { method: 'POST', body: JSON.stringify(dto) }),

  update: (id: string, dto: HouseAccessRightRequestDto): Promise<HouseAccessRightResponse> =>
    accessApiCall(`/v1/access-control/rights/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    }),

  delete: (id: number | string): Promise<void> =>
    accessApiCall(`/v1/access-control/rights/${encodeURIComponent(String(id))}`, {
      method: 'DELETE',
    }),

  getByMember: fetchAccessControlRightsByMember,
  getByHouse: fetchAccessControlRightsByHouse,

  checkAccess: (dto: AccessControlCheckRequestDto): Promise<AccessCheckResponse> =>
    accessApiCall('/v1/access-control/check', { method: 'POST', body: JSON.stringify(dto) }),

  cleanupExpired: (): Promise<void> =>
    accessApiCall('/v1/access-control/cleanup/expired', { method: 'POST' }),
};

export const accessRightsApi = {
  create: (dto: CreateAccessRightDto): Promise<AccessRightResponse> =>
    accessApiCall('/v1/access-rights', { method: 'POST', body: JSON.stringify(dto) }),

  delete: (id: number | string): Promise<void> =>
    import('../rbac-access-rights').then((m) => m.deleteRbacAccessRight(id)),

  getByUser: (userId: string): Promise<AccessRightResponse[]> =>
    import('../rbac-access-rights').then((m) => m.fetchRbacAccessRightsByUser(userId)),

  getByResource: (resourceId: number | string): Promise<AccessRightResponse[]> =>
    import('../rbac-access-rights').then((m) => m.fetchRbacAccessRightsByResource(resourceId)),

  rebuildCache: (): Promise<void> =>
    accessApiCall('/v1/permissions/rebuild', { method: 'POST' }),

  getAccessStructure: (userId: string): Promise<AccessStructureResponse> =>
    accessApiCall(`/v1/access-structure?userId=${encodeURIComponent(userId)}`),
};

export function fetchRbacAccessRightsByUser(userId: string): Promise<AccessRightResponse[]> {
  return import('../rbac-access-rights').then((m) => m.fetchRbacAccessRightsByUser(userId));
}

export function deleteRbacAccessRight(id: number | string): Promise<void> {
  return import('../rbac-access-rights').then((m) => m.deleteRbacAccessRight(id));
}

export function fetchRbacAccessRightsByResource(resourceId: number | string): Promise<AccessRightResponse[]> {
  return import('../rbac-access-rights').then((m) => m.fetchRbacAccessRightsByResource(resourceId));
}

/** @deprecated Use housesApi from this module directly */
export const accessApiClient = {
  houses: {
    getHouses: (params?: PageRequest): Promise<HouseResponse[] | PageResponse<HouseResponse>> =>
      accessApiCall(`/v1/houses${buildPageQuery(params)}`),
    getHousesByUser: (userId: string, params?: PageRequest): Promise<HouseResponse[] | PageResponse<HouseResponse>> =>
      accessApiCall(`/v1/houses/user/${userId}${buildPageQuery(params)}`),
    getAdminHouses: (params?: PageRequest): Promise<HouseResponse[] | PageResponse<HouseResponse>> =>
      accessApiCall(`/v1/admin/houses${buildPageQuery(params)}`),
    getAdminHousesByOwner: (ownerId: string, params?: PageRequest): Promise<HouseResponse[] | PageResponse<HouseResponse>> =>
      accessApiCall(`/v1/admin/houses/owner/${encodeURIComponent(ownerId)}${buildPageQuery(params)}`),
    getHouseById: (id: number): Promise<HouseResponse> =>
      accessApiCall(`/v1/houses/${id}`),
    create: (data: HouseRequest): Promise<HouseResponse> =>
      accessApiCall('/v1/houses', { method: 'POST', body: JSON.stringify(data) }),
  },
};
