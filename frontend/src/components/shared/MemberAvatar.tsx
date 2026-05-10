'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const PALETTE: Array<{ bg: string; text: string; ring: string }> = [
  { bg: 'bg-rose-500/15', text: 'text-rose-700 dark:text-rose-200', ring: 'ring-rose-500/20' },
  { bg: 'bg-orange-500/15', text: 'text-orange-700 dark:text-orange-200', ring: 'ring-orange-500/20' },
  { bg: 'bg-amber-500/15', text: 'text-amber-700 dark:text-amber-200', ring: 'ring-amber-500/20' },
  { bg: 'bg-lime-500/15', text: 'text-lime-700 dark:text-lime-200', ring: 'ring-lime-500/20' },
  { bg: 'bg-emerald-500/15', text: 'text-emerald-700 dark:text-emerald-200', ring: 'ring-emerald-500/20' },
  { bg: 'bg-teal-500/15', text: 'text-teal-700 dark:text-teal-200', ring: 'ring-teal-500/20' },
  { bg: 'bg-cyan-500/15', text: 'text-cyan-700 dark:text-cyan-200', ring: 'ring-cyan-500/20' },
  { bg: 'bg-sky-500/15', text: 'text-sky-700 dark:text-sky-200', ring: 'ring-sky-500/20' },
  { bg: 'bg-blue-500/15', text: 'text-blue-700 dark:text-blue-200', ring: 'ring-blue-500/20' },
  { bg: 'bg-indigo-500/15', text: 'text-indigo-700 dark:text-indigo-200', ring: 'ring-indigo-500/20' },
  { bg: 'bg-violet-500/15', text: 'text-violet-700 dark:text-violet-200', ring: 'ring-violet-500/20' },
  { bg: 'bg-fuchsia-500/15', text: 'text-fuchsia-700 dark:text-fuchsia-200', ring: 'ring-fuchsia-500/20' },
];

function normalizeName(name?: string) {
  const s = (name ?? '').trim().replace(/\s+/g, ' ');
  return s.length ? s : undefined;
}

function initialsFromName(name?: string) {
  const n = normalizeName(name);
  if (!n) return '??';
  const parts = n.split(' ').filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = (parts.length > 1 ? parts[parts.length - 1]?.[0] : parts[0]?.[1]) ?? '';
  const raw = `${first}${last}`.trim();
  return raw ? raw.toUpperCase() : '??';
}

function colorIndexFromName(name?: string) {
  const n = normalizeName(name);
  if (!n) return 0;
  const parts = n.split(' ').filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = (parts.length > 1 ? parts[parts.length - 1]?.[0] : parts[0]?.[1]) ?? '';
  const seed = `${first}${last}`.toLowerCase();
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 2147483647;
  }
  return Math.abs(hash) % PALETTE.length;
}

export function MemberAvatar({
  name,
  src,
  alt,
  size = 'sm',
}: {
  name?: string;
  src?: string;
  alt?: string;
  size?: 'sm' | 'default' | 'lg';
}) {
  const idx = colorIndexFromName(name);
  const palette = PALETTE[idx] ?? PALETTE[0]!;
  const initials = initialsFromName(name);

  return (
    <Avatar size={size} className={`ring-1 ${palette.ring}`}>
      {src ? <AvatarImage src={src} alt={alt ?? ''} /> : null}
      <AvatarFallback className={`${palette.bg} ${palette.text} font-medium`}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

