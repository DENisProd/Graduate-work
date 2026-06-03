export function toArray<T>(data: unknown): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as T[];
  const o = data as { content?: unknown[]; data?: unknown[] };
  if (Array.isArray(o?.content)) return o.content as T[];
  if (Array.isArray(o?.data)) return o.data as T[];
  return [];
}

export function getAccessTypeLabel(
  t: (key: Parameters<typeof import('@/lib/i18n').getTranslation>[1]) => string,
  type: string
): string {
  switch (type) {
    case 'ALLOW':
      return t('admin.accessControl.accessTypeAllow');
    case 'DENY':
      return t('admin.accessControl.accessTypeDeny');
    case 'WRITE':
      return t('admin.accessControl.accessTypeOnlyWrite');
    case 'READ':
      return t('admin.accessControl.accessTypeOnlyRead');
    default:
      return type;
  }
}

export function formatDate(value: string | undefined): string {
  if (!value) return '—';
  try {
    const d = new Date(value);
    return d.toLocaleString();
  } catch {
    return value;
  }
}

export function toDateTimeLocal(value: string | null | undefined): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${h}:${min}`;
}

export function getDisplayName(
  translations: Record<string, { name?: string }> | undefined,
  name: string | undefined,
  code: string | undefined,
  locale: string
): string {
  const exact = translations?.[locale]?.name;
  if (exact) return exact;
  const key = Object.keys(translations ?? {}).find((k) => k.toLowerCase() === locale.toLowerCase());
  if (key && translations?.[key]?.name) return translations[key].name ?? '';
  return translations?.ru?.name ?? translations?.en?.name ?? name ?? code ?? '';
}
