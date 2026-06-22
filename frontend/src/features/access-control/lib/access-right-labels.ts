import type { AccessRightResponse } from '@/types/api';

const PAGE_LABELS: Record<string, string> = {
  overview: 'Обзор',
  rooms: 'Комнаты',
  members: 'Участники',
  roles: 'Роли',
  devices: 'Устройства',
  scenarios: 'Сценарии',
  widgets: 'Виджеты',
  'room-planner': 'Планировщик',
  settings: 'Настройки',
};

const DEVICE_LABELS: Record<string, string> = {
  'demo-corridor-light': 'Свет в коридоре',
  'demo-living-light': 'Свет в гостиной',
  'demo-bedroom-light': 'Свет в спальне',
  'demo-living-thermo': 'Термостат в гостиной',
};

const FUNCTION_LABELS: Record<string, string> = {
  power: 'Включение',
  brightness: 'Яркость',
  target_temp: 'Целевая температура',
};

type AccessRightResource = {
  type?: string;
  name?: string | null;
  externalId?: string | null;
};

function accessActionLabel(type: string): string {
  switch (type) {
    case 'READ':
      return 'просмотр';
    case 'WRITE':
      return 'управление';
    case 'ALLOW':
      return 'полный доступ';
    case 'DENY':
      return 'запрет';
    default:
      return type.toLowerCase();
  }
}

export function formatAccessRightLabel(right: AccessRightResponse): string {
  const resource = (right as AccessRightResponse & { resource?: AccessRightResource }).resource;
  const action = accessActionLabel(right.accessRightType);

  if (resource?.type === 'PAGE') {
    const slug = resource.externalId ?? resource.name ?? 'страница';
    const pageName = PAGE_LABELS[slug] ?? slug;
    return `${pageName} — ${action}`;
  }

  if (resource?.type === 'DEVICE_FUNCTION') {
    const externalId = resource.externalId ?? '';
    const match = /^fn:([^:]+):(.+)$/.exec(externalId);
    if (match) {
      const [, deviceKey, fnCode] = match;
      const deviceName = DEVICE_LABELS[deviceKey] ?? deviceKey;
      const fnName = FUNCTION_LABELS[fnCode] ?? fnCode;
      return `${deviceName}: ${fnName} — ${action}`;
    }
    return `${resource.name ?? externalId ?? 'функция'} — ${action}`;
  }

  if (resource?.type === 'HOUSE') {
    return `Дом — ${action}`;
  }

  if (resource?.type === 'ROOM') {
    return `${resource.name ?? 'Комната'} — ${action}`;
  }

  if (resource?.type === 'DEVICE') {
    const key = resource.externalId ?? resource.name ?? 'устройство';
    return `${DEVICE_LABELS[key] ?? key} — ${action}`;
  }

  return `${resource?.name ?? resource?.externalId ?? 'ресурс'} — ${action}`;
}
