/** UI pages under /dashboard/houses/:houseId — externalId = slug */
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

/** Default role gets READ on these pages; others have no page right (access denied). */
export const DEFAULT_READ_PAGE_SLUGS: readonly HousePageSlug[] = [
  'overview',
  'rooms',
  'members',
  'devices',
  'scenarios',
  'widgets',
];
