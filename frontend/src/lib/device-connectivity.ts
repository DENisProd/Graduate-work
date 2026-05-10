export type ConnectivityStatus = 'ONLINE' | 'UNKNOWN' | 'OFFLINE';

function safeDateMs(value: string | number | Date | null | undefined): number | null {
  if (value == null) return null;
  const ms = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

/**
 * Business rule:
 * - last online < 1h  => ONLINE
 * - last online < 6h  => UNKNOWN
 * - otherwise         => OFFLINE
 *
 * If timestamp is missing/invalid => UNKNOWN.
 */
export function connectivityFromLastOnline(
  lastOnline: string | number | Date | null | undefined,
  nowMs: number = Date.now()
): ConnectivityStatus {
  const ts = safeDateMs(lastOnline);
  if (ts == null) return 'UNKNOWN';

  const diffMs = Math.max(0, nowMs - ts);
  if (diffMs < 60 * 60 * 1000) return 'ONLINE';
  if (diffMs < 6 * 60 * 60 * 1000) return 'UNKNOWN';
  return 'OFFLINE';
}

export function connectivityLabel(status: ConnectivityStatus, locale: 'ru' | 'en' | string) {
  const ru = String(locale).toLowerCase().startsWith('ru');
  if (status === 'ONLINE') return ru ? 'Онлайн' : 'Online';
  if (status === 'OFFLINE') return ru ? 'Оффлайн' : 'Offline';
  return ru ? 'Неизвестно' : 'Unknown';
}

