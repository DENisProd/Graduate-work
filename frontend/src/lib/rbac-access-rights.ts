'use client';

import type { AccessRightResponse } from '@/types/api';
import { accessServiceRequest } from './access-service-http';

export async function fetchRbacAccessRightsByUser(userId: string): Promise<AccessRightResponse[]> {
  return accessServiceRequest<AccessRightResponse[]>(
    `/v1/access-rights/user/${encodeURIComponent(userId)}`
  );
}

export async function deleteRbacAccessRight(id: number | string): Promise<void> {
  return accessServiceRequest<void>(`/v1/access-rights/${encodeURIComponent(String(id))}`, {
    method: 'DELETE',
  });
}

export async function fetchRbacAccessRightsByResource(
  resourceId: number | string
): Promise<AccessRightResponse[]> {
  return accessServiceRequest<AccessRightResponse[]>(
    `/v1/resources/${encodeURIComponent(String(resourceId))}/permissions`
  );
}
