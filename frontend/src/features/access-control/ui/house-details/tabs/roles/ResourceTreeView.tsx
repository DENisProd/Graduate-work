'use client';

import {
  Cpu,
  DoorOpen,
  Home,
  Layers,
  SlidersHorizontal,
  Sparkles,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { TreeNodeWithMeta } from './roles-helpers';

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  HOUSE: 'Дом',
  ROOM: 'Комната',
  DEVICE: 'Устройство',
  DEVICE_FUNCTION: 'Функция',
  SCENE: 'Сцена',
  GROUP: 'Группа',
  AUTOMATION: 'Автоматизация',
};

const RESOURCE_ICONS: Record<string, LucideIcon> = {
  HOUSE: Home,
  ROOM: DoorOpen,
  DEVICE: Cpu,
  DEVICE_FUNCTION: SlidersHorizontal,
  SCENE: Sparkles,
  GROUP: Layers,
  AUTOMATION: Zap,
};

function getNodeLabel(node: TreeNodeWithMeta): string {
  if (node.name) return node.name;
  if (node.externalId) return node.externalId;
  const type = typeof node.type === 'string' ? node.type : 'RESOURCE';
  return RESOURCE_TYPE_LABELS[type] ?? type;
}

function ResourceTreeItem({ node, depth }: { node: TreeNodeWithMeta; depth: number }) {
  const type = typeof node.type === 'string' ? node.type : 'RESOURCE';
  const Icon = RESOURCE_ICONS[type] ?? Cpu;
  const label = getNodeLabel(node);
  const children = Array.isArray(node.children) ? (node.children as TreeNodeWithMeta[]) : [];

  return (
    <li>
      <div
        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/60"
        style={{ paddingLeft: `${depth * 1.25 + 0.5}rem` }}
      >
        <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-sm text-foreground">{label}</span>
        <Badge variant="outline" className="shrink-0 text-[10px]">
          {RESOURCE_TYPE_LABELS[type] ?? type}
        </Badge>
      </div>
      {children.length > 0 && (
        <ul className="space-y-0.5">
          {children.map((child) => (
            <ResourceTreeItem key={String(child.id)} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

interface ResourceTreeViewProps {
  nodes: TreeNodeWithMeta[];
  loading?: boolean;
  emptyMessage?: string;
}

export function ResourceTreeView({ nodes, loading, emptyMessage }: ResourceTreeViewProps) {
  if (loading) {
    return (
      <div className="space-y-2 p-2">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-5/6" />
        <Skeleton className="h-5 w-4/6" />
        <Skeleton className="h-5 w-3/4" />
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="flex h-full min-h-[12rem] items-center justify-center p-4 text-center">
        <p className="max-w-xs text-sm text-muted-foreground">
          {emptyMessage ?? 'Пока ничего не добавлено. Создайте первую комнату или устройство слева.'}
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-0.5 py-1">
      {nodes.map((node) => (
        <ResourceTreeItem key={String(node.id)} node={node} depth={0} />
      ))}
    </ul>
  );
}
