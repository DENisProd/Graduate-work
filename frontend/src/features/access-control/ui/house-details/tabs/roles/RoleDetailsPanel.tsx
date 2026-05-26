'use client';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/hooks';
import type { HousePolicyResponse, HouseRoleResponse } from '@/types/api';

import { RoleMembersTable } from './RoleMembersTable';

type RelatedResource = { id: string; type?: string; path?: string };

interface Props {
  selectedRole: HouseRoleResponse;
  policiesLoading: boolean;
  resourcesLoading: boolean;
  roleMembersLoading: boolean;
  roleMembers: import('@/types/api').RoleMemberResponse[];
  relatedPolicies: HousePolicyResponse[];
  relatedResources: RelatedResource[];
}

export function RoleDetailsPanel({
  selectedRole,
  policiesLoading,
  resourcesLoading,
  roleMembersLoading,
  roleMembers,
  relatedPolicies,
  relatedResources,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h4 className="text-sm font-semibold text-foreground">
        {t('admin.accessControl.roleDetails')}
      </h4>

      <dl className="mt-3 space-y-1.5 text-sm">
        <div>
          <dt className="text-muted-foreground">{t('admin.accessControl.rolesTableRole')}</dt>
          <dd className="font-medium">{selectedRole.name ?? selectedRole.code ?? selectedRole.id}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t('admin.accessControl.rolesTablePriority')}</dt>
          <dd className="font-medium">{selectedRole.priority ?? '—'}</dd>
        </div>
      </dl>

      <div className="mt-4 border-t border-border pt-3">
        <p className="text-xs font-medium text-muted-foreground">Права роли</p>
        {selectedRole.permissions?.length ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {selectedRole.permissions.map((permission) => (
              <Badge key={permission} variant="secondary">
                {permission}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">{t('admin.noData')}</p>
        )}
      </div>

      <div className="mt-4 border-t border-border pt-3">
        <p className="text-xs font-medium text-muted-foreground">Политики для этой роли</p>
        {policiesLoading ? (
          <div className="mt-2 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ) : relatedPolicies.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">{t('admin.noData')}</p>
        ) : (
          <div className="mt-2 space-y-2">
            {relatedPolicies.map((policy) => (
              <div key={policy.id} className="rounded-md border border-border p-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-foreground">{policy.name ?? policy.id}</span>
                  <Badge variant="outline">{policy.effect ?? 'UNKNOWN'}</Badge>
                  <Badge variant="secondary">priority: {policy.priority ?? '—'}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  resourceId: {policy.resourceId ?? '—'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-border pt-3">
        <p className="text-xs font-medium text-muted-foreground">Ресурсы этой роли</p>
        {resourcesLoading ? (
          <div className="mt-2 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : relatedResources.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">{t('admin.noData')}</p>
        ) : (
          <div className="mt-2 space-y-2">
            {relatedResources.map((resource) => (
              <div key={resource.id} className="rounded-md border border-border p-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{resource.type ?? 'RESOURCE'}</Badge>
                  <span className="text-xs text-foreground">{resource.path ?? resource.id}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">id: {resource.id}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-border pt-3">
        <p className="text-xs font-medium text-muted-foreground">
          {t('admin.accessControl.rolesTableUsers')}
        </p>
        <RoleMembersTable loading={roleMembersLoading} members={roleMembers} />
      </div>
    </div>
  );
}

