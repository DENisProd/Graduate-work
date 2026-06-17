'use client';

import {
  Check,
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
import { useTranslation } from '@/hooks';
import type { HousePolicyResponse, HouseRoleResponse } from '@/types/api';

import { PolicyListPanel } from './PolicyListPanel';
import { RoleMembersTable } from './RoleMembersTable';

type RelatedResource = { id: string; type?: string; path?: string };

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

function getPermissionLabel(
  permission: string,
  t: (key: string) => string,
): string {
  switch (permission) {
    case 'INVITE_MEMBERS':
      return t('admin.accessControl.permInviteMembers');
    case 'EDIT_ROLES':
      return t('admin.accessControl.permEditRoles');
    case 'MANAGE_DEVICES':
      return t('admin.accessControl.permManageDevices');
    case 'MANAGE_AUTOMATIONS':
      return t('admin.accessControl.permManageAutomations');
    default:
      return permission;
  }
}

function DetailSection({
  title,
  description,
  count,
  children,
}: {
  title: string;
  description?: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-muted/20 p-3">
      <div className="mb-2.5">
        <h5 className="text-sm font-medium text-foreground">
          {title}
          {count !== undefined ? ` (${count})` : ''}
        </h5>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

interface Props {
  selectedRole: HouseRoleResponse;
  policiesLoading: boolean;
  resourcesLoading: boolean;
  roleMembersLoading: boolean;
  roleMembers: import('@/types/api').RoleMemberResponse[];
  relatedPolicies: HousePolicyResponse[];
  relatedResources: RelatedResource[];
  resourcesById: Map<string, { id: string; type: string; name?: string; path: string }>;
  roles: HouseRoleResponse[];
  houseMembers: Array<{ id: string; name?: string }>;
}

export function RoleDetailsPanel({
  selectedRole,
  policiesLoading,
  resourcesLoading,
  roleMembersLoading,
  roleMembers,
  relatedPolicies,
  relatedResources,
  resourcesById,
  roles,
  houseMembers,
}: Props) {
  const { t } = useTranslation();
  const roleName = selectedRole.name ?? selectedRole.code ?? selectedRole.id;
  const permissions = selectedRole.permissions ?? [];

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('admin.accessControl.roleDetails')}
          </p>
          <h4 className="mt-1 truncate text-lg font-semibold text-foreground">{roleName}</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('admin.accessControl.rolesTablePriority')}:{' '}
            <span className="font-medium text-foreground">{selectedRole.priority ?? '—'}</span>
          </p>
        </div>
        {selectedRole.system && (
          <Badge variant="secondary">{t('admin.accessControl.rolesTableSystem')}</Badge>
        )}
      </div>

      <div className="mt-4 space-y-3">
        <DetailSection
          title="Права роли"
          description="Что участники с этой ролью могут делать в доме"
        >
          {permissions.length > 0 ? (
            <ul className="space-y-1.5">
              {permissions.map((permission) => (
                <li key={permission} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" aria-hidden />
                  <span>{getPermissionLabel(permission, t)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">{t('admin.noData')}</p>
          )}
        </DetailSection>

        <DetailSection
          title="Правила доступа"
          description="Ограничения и разрешения для этой роли"
          count={relatedPolicies.length || undefined}
        >
          <PolicyListPanel
            policies={relatedPolicies}
            roles={roles}
            houseMembers={houseMembers}
            resourcesById={resourcesById}
            loading={policiesLoading}
            embedded
            compactSubject
            emptyMessage="Для этой роли пока нет правил. Настройте их на вкладке «Политики»."
          />
        </DetailSection>

        <DetailSection
          title="Объекты"
          description="Комнаты и устройства, к которым применяются правила"
          count={relatedResources.length || undefined}
        >
          {resourcesLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-4/5" />
            </div>
          ) : relatedResources.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t('admin.noData')}</p>
          ) : (
            <div className="space-y-2">
              {relatedResources.map((resource) => {
                const type = resource.type ?? 'RESOURCE';
                const Icon = RESOURCE_ICONS[type] ?? Cpu;
                const typeLabel = RESOURCE_TYPE_LABELS[type] ?? type;

                return (
                  <div
                    key={resource.id}
                    className="flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-2"
                  >
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Icon className="size-3.5 text-muted-foreground" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-foreground">
                        {resource.path ?? typeLabel}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {typeLabel}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </DetailSection>

        <DetailSection
          title={t('admin.accessControl.rolesTableUsers')}
          description="Участники дома с этой ролью"
          count={roleMembers.length || undefined}
        >
          <RoleMembersTable loading={roleMembersLoading} members={roleMembers} embedded />
        </DetailSection>
      </div>
    </div>
  );
}
