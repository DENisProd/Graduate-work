'use client';

import { useMemo } from 'react';
import { useAccessControlStore } from '@/store/access-control-store';
import { useCurrentUserId } from './use-current-user-id';

export interface HousePermissions {
  isOwner: boolean;
  canInviteMembers: boolean;
  canEditRoles: boolean;
  canManageDevices: boolean;
  canManageAutomations: boolean;
  loading: boolean;
}

/**
 * Derives the current user's effective HousePermissions from the already-loaded
 * members list. Owners get all permissions implicitly.
 */
export function useHousePermissions(): HousePermissions {
  const house = useAccessControlStore((s) => s.house);
  const members = useAccessControlStore((s) => s.members);
  const currentUserId = useCurrentUserId();

  return useMemo(() => {
    if (!currentUserId || !house) {
      return {
        isOwner: false,
        canInviteMembers: false,
        canEditRoles: false,
        canManageDevices: false,
        canManageAutomations: false,
        loading: true,
      };
    }

    const isOwner = house.ownerId === currentUserId;
    if (isOwner) {
      return {
        isOwner: true,
        canInviteMembers: true,
        canEditRoles: true,
        canManageDevices: true,
        canManageAutomations: true,
        loading: false,
      };
    }

    const currentMember = members.find((m) => m.userId === currentUserId);
    const permissions = currentMember?.roles.flatMap((r) => r.permissions) ?? [];

    return {
      isOwner: false,
      canInviteMembers: permissions.includes('INVITE_MEMBERS'),
      canEditRoles: permissions.includes('EDIT_ROLES'),
      canManageDevices: permissions.includes('MANAGE_DEVICES'),
      canManageAutomations: permissions.includes('MANAGE_AUTOMATIONS'),
      loading: members.length === 0,
    };
  }, [house, members, currentUserId]);
}
