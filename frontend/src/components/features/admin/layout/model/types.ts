import type { ComponentType } from 'react';

export type GroupKey = 'devices' | 'reference' | 'security';

export interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  group?: GroupKey;
}
