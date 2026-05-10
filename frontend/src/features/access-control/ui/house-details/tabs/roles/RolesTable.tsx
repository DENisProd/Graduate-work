'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { MemberAvatar } from '@/components/shared/MemberAvatar';
import { AppButton } from '@/components/ui/app-button';
import { AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar';
import { useTranslation } from '@/hooks';
import type { HouseRoleResponse } from '@/types/api';

interface Props {
  roles: HouseRoleResponse[];
  selectedRoleId: string | null;
  canEditRoles: boolean;
  roleMemberCounts?: Record<string, number>;
  roleMemberPreviews?: Record<string, Array<{ id: string; name?: string; avatarUrl?: string }>>;
  onSelectRole: (role: HouseRoleResponse) => void;
  onEditRole: (role: HouseRoleResponse) => void;
  onDeleteRole: (role: HouseRoleResponse) => void;
}

export function RolesTable({
  roles,
  selectedRoleId,
  canEditRoles,
  roleMemberCounts,
  roleMemberPreviews,
  onSelectRole,
  onEditRole,
  onDeleteRole,
}: Props) {
  const { t } = useTranslation();

  const columns: Column<HouseRoleResponse>[] = [
    {
      key: 'name',
      label: t('admin.accessControl.rolesTableRole'),
      render: (role) => role.name ?? role.code ?? role.id,
    },
    {
      key: 'priority',
      label: t('admin.accessControl.rolesTablePriority'),
      render: (role) => (role.priority !== undefined ? role.priority : '—'),
    },
    {
      key: 'memberCount',
      label: t('admin.accessControl.rolesTableUsers'),
      render: (role) => {
        const derived = roleMemberCounts?.[role.id];
        const value = derived ?? role.memberCount;
        const total = value ?? 0;
        const preview = roleMemberPreviews?.[role.id] ?? [];
        const visible = preview.slice(0, 4);
        const rest = Math.max(0, total - visible.length);

        if (total <= 0) return '—';

        return (
          <div className="flex items-center justify-start">
            <AvatarGroup className="justify-start">
              {visible.map((m) => (
                <MemberAvatar
                  key={m.id}
                  size="sm"
                  src={m.avatarUrl}
                  name={m.name}
                  alt={m.name ?? m.id}
                />
              ))}
              {rest > 0 && <AvatarGroupCount className="text-xs">+{rest}</AvatarGroupCount>}
            </AvatarGroup>
          </div>
        );
      },
    },
    {
      key: 'system',
      label: t('admin.accessControl.rolesTableSystem'),
      render: (role) => (role.system ? t('admin.accessControl.rolesTableSystem') : '—'),
    },
  ];

  return (
    <DataTable<HouseRoleResponse>
      data={roles}
      columns={columns}
      onRowClick={onSelectRole}
      isRowSelected={(role) => role.id === selectedRoleId}
      actions={
        canEditRoles
          ? (role) =>
              !role.system ? (
                <>
                  <AppButton
                    size="sm"
                    variant="secondary"
                    onClick={() => onEditRole(role)}
                    aria-label={t('admin.edit')}
                  >
                    <Pencil className="size-4" />
                  </AppButton>
                  <AppButton
                    size="sm"
                    variant="destructive"
                    onClick={() => onDeleteRole(role)}
                    aria-label={t('admin.delete')}
                  >
                    <Trash2 className="size-4" />
                  </AppButton>
                </>
              ) : null
          : undefined
      }
    />
  );
}

