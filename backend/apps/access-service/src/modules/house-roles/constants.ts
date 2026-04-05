import { HousePermission } from '@prisma/client';

/** Имена системных ролей по умолчанию для каждого дома */
export const SYSTEM_ROLE_NAMES = {
  OWNER: 'Владелец',
  ADMIN: 'Админ',
  DEFAULT: 'По умолчанию',
} as const;

/** Приоритет системных ролей (меньше = выше в иерархии) */
export const SYSTEM_ROLE_PRIORITIES = {
  [SYSTEM_ROLE_NAMES.OWNER]: 1,
  [SYSTEM_ROLE_NAMES.ADMIN]: 2,
  [SYSTEM_ROLE_NAMES.DEFAULT]: 3,
} as const;

/** Все доменные права (роли дома), не путать с AccessRight по ресурсам */
const ALL_HOUSE_PERMISSIONS: HousePermission[] = [
  HousePermission.INVITE_MEMBERS,
  HousePermission.EDIT_ROLES,
  HousePermission.MANAGE_DEVICES,
  HousePermission.MANAGE_AUTOMATIONS,
];

/** Права для ролей Владелец и Админ */
export const SYSTEM_ROLE_PERMISSIONS: Record<string, HousePermission[]> = {
  [SYSTEM_ROLE_NAMES.OWNER]: ALL_HOUSE_PERMISSIONS,
  [SYSTEM_ROLE_NAMES.ADMIN]: ALL_HOUSE_PERMISSIONS,
  [SYSTEM_ROLE_NAMES.DEFAULT]: [],
};
