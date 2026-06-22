export const HOUSE_PAGE_DEFINITIONS = [
  { slug: 'overview', name: 'Обзор' },
  { slug: 'rooms', name: 'Комнаты' },
  { slug: 'members', name: 'Участники' },
  { slug: 'roles', name: 'Роли' },
  { slug: 'devices', name: 'Устройства' },
  { slug: 'scenarios', name: 'Сценарии' },
  { slug: 'widgets', name: 'Виджеты' },
  { slug: 'room-planner', name: 'Планировщик' },
  { slug: 'settings', name: 'Настройки' },
] as const;

export type HousePageSlug = (typeof HOUSE_PAGE_DEFINITIONS)[number]['slug'];

export type HousePageAccess = Record<HousePageSlug, { read: boolean; write: boolean }>;

/** Map dashboard pathname segment to page slug */
export function pathnameToHousePageSlug(pathname: string, houseId: string): HousePageSlug {
  const base = `/dashboard/houses/${houseId}`;
  if (pathname === base || pathname === `${base}/`) return 'overview';
  if (pathname.includes('/room-planner')) return 'room-planner';
  if (pathname.includes('/widgets')) return 'widgets';
  if (pathname.includes('/settings')) return 'settings';
  if (pathname.includes('/roles')) return 'roles';
  if (pathname.includes('/members')) return 'members';
  if (pathname.includes('/devices')) return 'devices';
  if (pathname.includes('/scenarios')) return 'scenarios';
  if (pathname.includes('/rooms')) return 'rooms';
  return 'overview';
}

export function allPagesAllowed(): HousePageAccess {
  return Object.fromEntries(
    HOUSE_PAGE_DEFINITIONS.map(({ slug }) => [slug, { read: true, write: true }]),
  ) as HousePageAccess;
}

export function emptyPageAccess(): HousePageAccess {
  return Object.fromEntries(
    HOUSE_PAGE_DEFINITIONS.map(({ slug }) => [slug, { read: false, write: false }]),
  ) as HousePageAccess;
}
