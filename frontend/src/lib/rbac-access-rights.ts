'use client';

/**
 * RBAC: GET/DELETE /v1/access-rights/… — без импорта api-client.ts (нет циклов с HMR).
 */

import type { AccessRightResponse } from '@/types/api';
import { accessServiceRequest } from './access-service-http';

/** GET /v1/access-rights/user/{id} */
export async function fetchRbacAccessRightsByUser(userId: string): Promise<AccessRightResponse[]> {
  return accessServiceRequest<AccessRightResponse[]>(
    `/v1/access-rights/user/${encodeURIComponent(userId)}`
  );
}

/** DELETE /v1/access-rights/{id} */
export async function deleteRbacAccessRight(id: number | string): Promise<void> {
  return accessServiceRequest<void>(`/v1/access-rights/${encodeURIComponent(String(id))}`, {
    method: 'DELETE',
  });
}

/** GET /v1/resources/{id}/permissions */
export async function fetchRbacAccessRightsByResource(
  resourceId: number | string
): Promise<AccessRightResponse[]> {
  return accessServiceRequest<AccessRightResponse[]>(
    `/v1/resources/${encodeURIComponent(String(resourceId))}/permissions`
  );
}
