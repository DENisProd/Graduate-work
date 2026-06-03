import { HousePermission } from '@prisma/client';

export const SYSTEM_ROLE_NAMES = {
  OWNER: 'Владелец',
  ADMIN: 'Админ',
  DEFAULT: 'По умолчанию',
} as const;

export const SYSTEM_ROLE_PRIORITIES = {
  [SYSTEM_ROLE_NAMES.OWNER]: 1,
  [SYSTEM_ROLE_NAMES.ADMIN]: 2,
  [SYSTEM_ROLE_NAMES.DEFAULT]: 3,
} as const;

const ALL_HOUSE_PERMISSIONS: HousePermission[] = [
  HousePermission.INVITE_MEMBERS,
  HousePermission.EDIT_ROLES,
  HousePermission.MANAGE_DEVICES,
  HousePermission.MANAGE_AUTOMATIONS,
];

export const SYSTEM_ROLE_PERMISSIONS: Record<string, HousePermission[]> = {
  [SYSTEM_ROLE_NAMES.OWNER]: ALL_HOUSE_PERMISSIONS,
  [SYSTEM_ROLE_NAMES.ADMIN]: ALL_HOUSE_PERMISSIONS,
  [SYSTEM_ROLE_NAMES.DEFAULT]: [],
};
