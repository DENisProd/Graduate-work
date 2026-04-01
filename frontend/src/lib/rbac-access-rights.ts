'use client';

/**
 * RBAC: GET/DELETE /api/v1/access-rights/… — без импорта api-client.ts (нет циклов с HMR).
 */

import type { AccessRightResponse } from '@/types/api';
import { accessServiceRequest } from './access-service-http';

/** GET /api/v1/access-rights/user/{id} */
export async function fetchRbacAccessRightsByUser(userId: string): Promise<AccessRightResponse[]> {
  return accessServiceRequest<AccessRightResponse[]>(
    `/api/v1/access-rights/user/${encodeURIComponent(userId)}`
  );
}

/** DELETE /api/v1/access-rights/{id} */
export async function deleteRbacAccessRight(id: number | string): Promise<void> {
  return accessServiceRequest<void>(`/api/v1/access-rights/${encodeURIComponent(String(id))}`, {
    method: 'DELETE',
  });
}

/** GET /api/v1/resources/{id}/permissions */
export async function fetchRbacAccessRightsByResource(
  resourceId: number | string
): Promise<AccessRightResponse[]> {
  return accessServiceRequest<AccessRightResponse[]>(
    `/api/v1/resources/${encodeURIComponent(String(resourceId))}/permissions`
  );
}
