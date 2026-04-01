'use client';

import { cn } from '@/lib/utils';

type HouseRole = 'owner' | 'member';

interface RoleBadgeProps {
  role: HouseRole;
  className?: string;
}

const roleStyles: Record<HouseRole, string> = {
  owner: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  member: 'bg-muted text-muted-foreground',
};

const roleLabels: Record<HouseRole, string> = {
  owner: 'Владелец',
  member: 'Участник',
};

export function RoleBadge({ role, className }: RoleBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        roleStyles[role],
        className
      )}
    >
      {roleLabels[role]}
    </span>
  );
}

/** Derive role for house list: owner if house.ownerId === currentUserId */
export function getHouseRole(ownerId: string, currentUserId: string): HouseRole {
  return ownerId === currentUserId ? 'owner' : 'member';
}
