'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Copy, X } from 'lucide-react';
import { AppButton } from '@/components/ui/app-button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogClose, DialogTitle } from '@/components/ui/dialog';
import type {
  AccessRightResponse,
  CreateAccessRightDto,
  HouseMemberRoleBriefDto,
  HouseMemberResponse,
  HouseRoleResponse,
} from '@/types/api';
import { useTranslation } from '@/hooks';
import { houseRolesApi, houseMembersApi } from '@/lib/api-client';
import { fetchRbacAccessRightsByUser } from '@/lib/rbac-access-rights';
import { useAccessControlStore } from '@/store/access-control-store';
import { toArray, getAccessTypeLabel, formatDate } from '../../lib/utils';
import { formatAccessRightLabel } from '../../lib/access-right-labels';
import { AccessRightFormModal } from './AccessRightFormModal';

interface MemberDetailModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  member: HouseMemberResponse | null;
  /** Called when a new right is created for this member (refetch rights after). */
  onCreateRight?: (data: CreateAccessRightDto) => Promise<void>;
  /** Called when a right is deleted (refetch rights after). */
  onDeleteRight?: (rightId: string) => Promise<void>;
}

function getScopeLabel(right: AccessRightResponse): string {
  const parts: string[] = [`resource: ${right.resourceId}`];
  if (right.houseMemberId) parts.push(`member: ${right.houseMemberId}`);
  if (right.roleId) parts.push(`role: ${right.roleId}`);
  if (right.parameters && Object.keys(right.parameters).length > 0) {
    parts.push(JSON.stringify(right.parameters));
  }
  return parts.join(' · ');
}

function isRightExpired(right: AccessRightResponse): boolean {
  if (!right.expiresAt) return false;
  return new Date(right.expiresAt).getTime() < Date.now();
}

function getPermissionLabel(permission: string): string {
  switch (permission) {
    case 'INVITE_MEMBERS':
      return 'Приглашать участников';
    case 'EDIT_ROLES':
      return 'Управлять ролями';
    case 'MANAGE_DEVICES':
      return 'Управлять устройствами';
    case 'MANAGE_AUTOMATIONS':
      return 'Управлять автоматизациями';
    default:
      return permission;
  }
}

function getResourceLabel(right: AccessRightResponse): string {
  const resourceType = (right as AccessRightResponse & { resource?: { type?: string } }).resource?.type;
  if (resourceType === 'HOUSE') return 'Дом';
  if (resourceType === 'ROOM') return 'Комната';
  if (resourceType === 'DEVICE') return 'Устройство';
  if (resourceType === 'DEVICE_FUNCTION') return 'Функция устройства';
  return 'Ресурс';
}

function getGrantedByLabel(right: AccessRightResponse): string {
  if (right.roleId) return 'Через роль';
  if (right.houseMemberId) return 'Прямо участнику';
  return '—';
}

export function MemberDetailModal({
  isOpen,
  onOpenChange,
  member,
  onCreateRight,
  onDeleteRight,
}: MemberDetailModalProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const currentHouseId = useAccessControlStore((s) => s.houseId);
  const [rights, setRights] = useState<AccessRightResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [houseRoles, setHouseRoles] = useState<HouseRoleResponse[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [roleUpdatingId, setRoleUpdatingId] = useState<string | null>(null);
  const [rolesPickerOpen, setRolesPickerOpen] = useState(false);
  const [memberRoles, setMemberRoles] = useState<HouseMemberRoleBriefDto[]>([]);
  const [rightFormOpen, setRightFormOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadRights = useCallback(() => {
    if (!member?.userId) return;
    setLoading(true);
    void fetchRbacAccessRightsByUser(member.userId)
      .then((data) => setRights(toArray<AccessRightResponse>(data)))
      .catch(() => setRights([]))
      .finally(() => setLoading(false));
  }, [member?.userId]);

  useEffect(() => {
    if (!isOpen || !member) {
      setRights([]);
      return;
    }
    loadRights();
  }, [isOpen, member?.userId, loadRights]);

  useEffect(() => {
    setMemberRoles(member?.roles ?? []);
  }, [member?.id, member?.roles]);

  const loadHouseRoles = useCallback(async () => {
    const effectiveHouseId = member?.houseId ?? (currentHouseId != null ? String(currentHouseId) : undefined);
    if (!effectiveHouseId) {
      setHouseRoles([]);
      return;
    }
    setRolesLoading(true);
    try {
      const data = await houseRolesApi.getHouseRoles(effectiveHouseId);
      setHouseRoles(data);
    } catch {
      setHouseRoles([]);
    } finally {
      setRolesLoading(false);
    }
  }, [member?.houseId, currentHouseId]);

  useEffect(() => {
    const effectiveHouseId = member?.houseId ?? (currentHouseId != null ? String(currentHouseId) : undefined);
    if (!isOpen || !member || !effectiveHouseId) {
      setHouseRoles([]);
      return;
    }
    void loadHouseRoles();
  }, [isOpen, member?.id, member?.houseId, currentHouseId, loadHouseRoles]);

  const refreshMemberRoles = useCallback(async () => {
    const effectiveHouseId = member?.houseId ?? (currentHouseId != null ? String(currentHouseId) : undefined);
    if (!effectiveHouseId || !member?.id) return;
    try {
      const data = await houseMembersApi.getByHouseId(effectiveHouseId, { page: 0, size: 200 });
      const members = toArray<HouseMemberResponse>(data);
      const updated = members.find((m) => m.id === member.id);
      if (updated) {
        setMemberRoles(updated.roles);
      }
    } catch {
      return;
    }
  }, [member?.houseId, member?.id, currentHouseId]);

  const handleToggleRole = async (role: HouseRoleResponse) => {
    if (!member?.id) return;
    const roleId = String(role.id);
    const isAssigned = memberRoles.some((r) => r.roleId === roleId);
    setRoleUpdatingId(roleId);
    try {
      if (isAssigned) {
        await houseRolesApi.removeRoleFromMember(member.id, roleId);
      } else {
        await houseRolesApi.assignRoleToMember(member.id, roleId);
      }
      await refreshMemberRoles();
      await loadRights();
    } finally {
      setRoleUpdatingId(null);
    }
  };

  const handleCreateRight = async (data: CreateAccessRightDto) => {
    if (onCreateRight) {
      await onCreateRight(data);
      loadRights();
    }
    setRightFormOpen(false);
  };

  const handleDeleteRight = async (rightId: string) => {
    if (!onDeleteRight) return;
    setDeletingId(rightId);
    try {
      await onDeleteRight(rightId);
      loadRights();
    } finally {
      setDeletingId(null);
    }
  };

  if (!member) return null;

  const isAdminMode = pathname?.startsWith('/admin') ?? false;
  const showAdminControls = isAdminMode && Boolean(onCreateRight || onDeleteRight);
  const displayName = member.userId;
  const initial = displayName.charAt(0).toUpperCase();
  const copyRaw = async (value: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      return;
    }
  };

  const roleCapabilityLabels = Array.from(
    new Set([
      ...memberRoles.flatMap((role) => role.permissions.map(getPermissionLabel)),
      ...rights.map(formatAccessRightLabel),
    ]),
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[90vh] w-full max-w-[96vw] xl:max-w-7xl 2xl:max-w-[1600px] flex-col gap-0 overflow-hidden p-0"
      >
        {/* Header — как в прототипе */}
        <div className="flex items-center justify-between border-b border-border p-6">
          <div className="flex items-center gap-3">
            {member.userAvatarUrl ? (
              <img
                src={member.userAvatarUrl}
                alt=""
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                {initial}
              </div>
            )}
            <div>
              <DialogTitle className="text-xl font-semibold text-foreground">{displayName}</DialogTitle>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">{member.houseName}</span>
                {memberRoles.map((role) => (
                  <Badge key={role.memberRoleId} variant="secondary" className="text-xs">
                    {role.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogClose asChild>
            <button
              type="button"
              className="rounded p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={t('admin.accessControl.closePanel')}
            >
              <X className="h-5 w-5" />
            </button>
          </DialogClose>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 text-lg font-semibold text-foreground">
                Участник дома
              </h3>
              <div className="space-y-4 rounded-lg border border-border bg-muted/50 p-4">
                <div className="grid gap-2 rounded-md bg-background p-3">
                  <div className="text-xs text-muted-foreground">{t('admin.accessControl.joinedAt')}</div>
                  <div className="text-sm font-medium text-foreground">{member.joinedAt || '—'}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-foreground">Роли в доме</div>
                  {memberRoles.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Роли не назначены</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {memberRoles.map((role) => (
                        <Badge key={role.memberRoleId} variant="secondary">
                          {role.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                {roleCapabilityLabels.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-foreground">Что можно делать</div>
                    <div className="flex flex-wrap gap-2">
                      {roleCapabilityLabels.map((label) => (
                        <Badge key={label} variant="outline" className="text-xs">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-lg font-semibold text-foreground">
                {t('admin.accessControl.effectiveRights')} {loading && '(...)'}
              </h3>
              <div className="max-h-96 space-y-2 overflow-y-auto rounded-lg border border-border bg-muted/50 p-4">
                {rights.length === 0 && !loading && (
                  <p className="text-sm text-muted-foreground">
                    Для этого участника нет правил доступа.
                  </p>
                )}
                {rights.map((right) => (
                  <div key={right.id} className="rounded-md bg-background p-3">
                    <div className="text-sm font-medium text-foreground">
                      {formatAccessRightLabel(right)}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {getGrantedByLabel(right)}
                      {right.roleId ? '' : ` · ${getAccessTypeLabel(t, right.accessRightType)}`}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {t('admin.accessControl.validFrom')}: {formatDate(right.createdAt)}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {t('admin.accessControl.validTo')}: {right.expiresAt ? formatDate(right.expiresAt) : '—'}
                      {isRightExpired(right) && (
                        <span className="ml-1 text-destructive">({t('admin.accessControl.expired')})</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {showAdminControls && (
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="mb-3 text-lg font-semibold text-foreground">
                  {t('admin.accessControl.memberRoles')}
                </h3>
                <div className="space-y-3 rounded-lg border border-border p-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-foreground">Текущие роли пользователя</div>
                    {memberRoles.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Роли не назначены</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {memberRoles.map((role) => (
                          <Badge key={role.memberRoleId ?? role.roleId} variant="secondary">
                            {role.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <AppButton
                    variant="secondary"
                    onClick={() => setRolesPickerOpen((prev) => !prev)}
                  >
                    {rolesPickerOpen ? 'Скрыть список ролей дома' : 'Назначить роли'}
                  </AppButton>

                  {rolesPickerOpen && (
                    <div className="space-y-3 rounded-md border border-border bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">
                        Выберите роль из списка дома, чтобы назначить или снять её у участника.
                      </p>
                  {rolesLoading && (
                        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
                  )}
                      {!rolesLoading && houseRoles.length === 0 && (
                        <p className="text-sm text-muted-foreground">Роли дома не найдены</p>
                  )}
                      {!rolesLoading && houseRoles.length > 0 && (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {houseRoles.map((role) => {
                            const roleId = String(role.id);
                            const isAssigned = memberRoles.some((r) => String(r.roleId) === roleId);
                            const label = role.name ?? role.code ?? roleId;
                            return (
                              <div
                                key={roleId}
                                className="flex items-center justify-between gap-2 rounded-md border border-border p-2"
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-foreground">{label}</p>
                                  <p className="truncate text-xs text-muted-foreground" title={roleId}>
                                    {roleId}
                                  </p>
                                </div>
                                <AppButton
                                  size="sm"
                                  variant={isAssigned ? 'secondary' : 'default'}
                                  disabled={roleUpdatingId === roleId}
                                  onClick={() => handleToggleRole(role)}
                                >
                                  {isAssigned ? 'Снять' : 'Назначить'}
                                </AppButton>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                  {!rolesPickerOpen && !rolesLoading && houseRoles.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Всего ролей дома: {houseRoles.length}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-lg font-semibold text-foreground">
                  {t('admin.accessControl.addRight')}
                </h3>
                <div className="space-y-4 rounded-lg border border-border p-4">
                  {onCreateRight ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        {t('admin.accessControl.rights')} — {t('admin.accessControl.operationType')},{' '}
                        {t('admin.accessControl.houseRoomId')}, {t('admin.accessControl.deviceId')},{' '}
                        {t('admin.accessControl.expiresAt')}.
                      </p>
                      <AppButton
                        className="w-full"
                        onClick={() => setRightFormOpen(true)}
                      >
                        {t('admin.create')} — {t('admin.accessControl.rights')}
                      </AppButton>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t('admin.accessControl.noRights')}</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-lg font-semibold text-foreground">
                  {t('admin.accessControl.individualRights')}
                </h3>
                <div className="overflow-hidden rounded-lg border border-border bg-background">
                  <div className="space-y-3 p-3 md:hidden">
                    {rights.length === 0 && !loading && (
                      <div className="rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                        {t('admin.accessControl.noRights')}
                      </div>
                    )}
                    {rights.map((right) => (
                      <div key={right.id} className="space-y-2 rounded-md border border-border bg-background p-3">
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">{t('admin.accessControl.scope')}</div>
                          <div className="flex items-center justify-between gap-2">
                            <span title={getScopeLabel(right)} className="text-sm font-medium text-foreground">
                              {getResourceLabel(right)}
                            </span>
                            <button
                              type="button"
                              title={`Скопировать: ${getScopeLabel(right)}`}
                              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                              onClick={() => copyRaw(getScopeLabel(right))}
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">{t('admin.accessControl.operationType')}</div>
                          <div className="flex items-center justify-between gap-2">
                            <span
                              title={right.accessRightType}
                              className="inline-flex rounded bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                            >
                              {getAccessTypeLabel(t, right.accessRightType)}
                            </span>
                            <button
                              type="button"
                              title={`Скопировать: ${right.accessRightType}`}
                              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                              onClick={() => copyRaw(right.accessRightType)}
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t('admin.accessControl.validFrom')}: {formatDate(right.createdAt)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t('admin.accessControl.validTo')}: {right.expiresAt ? formatDate(right.expiresAt) : '—'}
                          {isRightExpired(right) && (
                            <span className="ml-1 text-destructive">
                              ({t('admin.accessControl.expired')})
                            </span>
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">{t('admin.accessControl.grantedBy')}</div>
                          <div className="flex items-center justify-between gap-2">
                            <span
                              title={right.roleId ?? right.houseMemberId ?? '—'}
                              className="text-sm text-foreground"
                            >
                              {getGrantedByLabel(right)}
                            </span>
                            {(right.roleId || right.houseMemberId) && (
                              <button
                                type="button"
                                title={`Скопировать: ${right.roleId ?? right.houseMemberId ?? ''}`}
                                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                onClick={() => copyRaw(right.roleId ?? right.houseMemberId ?? '')}
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        {onDeleteRight && (
                          <AppButton
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            disabled={deletingId === right.id}
                            onClick={() => handleDeleteRight(right.id)}
                          >
                            {t('admin.delete')}
                          </AppButton>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full">
                      <thead className="border-b border-border bg-muted/50">
                        <tr>
                          <th className="px-3 py-2 text-left text-sm font-medium text-foreground">
                            {t('admin.accessControl.scope')}
                          </th>
                          <th className="px-3 py-2 text-left text-sm font-medium text-foreground">
                            {t('admin.accessControl.operationType')}
                          </th>
                          <th className="px-3 py-2 text-left text-sm font-medium text-foreground">
                            {t('admin.accessControl.validFrom')}
                          </th>
                          <th className="px-3 py-2 text-left text-sm font-medium text-foreground">
                            {t('admin.accessControl.validTo')}
                          </th>
                          <th className="px-3 py-2 text-left text-sm font-medium text-foreground">
                            {t('admin.accessControl.grantedBy')}
                          </th>
                          {onDeleteRight && (
                            <th className="px-3 py-2 text-left text-sm font-medium text-foreground">
                              {t('admin.delete')}
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {rights.length === 0 && !loading && (
                          <tr>
                            <td
                              colSpan={onDeleteRight ? 6 : 5}
                              className="px-3 py-4 text-center text-sm text-muted-foreground"
                            >
                              {t('admin.accessControl.noRights')}
                            </td>
                          </tr>
                        )}
                        {rights.map((right) => (
                          <tr
                            key={right.id}
                            className="border-b border-border last:border-b-0"
                          >
                            <td className="px-3 py-2 text-sm text-foreground">
                              <div className="flex items-center justify-between gap-2">
                                <span title={getScopeLabel(right)}>{getResourceLabel(right)}</span>
                                <button
                                  type="button"
                                  title={`Скопировать: ${getScopeLabel(right)}`}
                                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                  onClick={() => copyRaw(getScopeLabel(right))}
                                >
                                  <Copy className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  title={right.accessRightType}
                                  className="inline-flex rounded bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                                >
                                  {getAccessTypeLabel(t, right.accessRightType)}
                                </span>
                                <button
                                  type="button"
                                  title={`Скопировать: ${right.accessRightType}`}
                                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                  onClick={() => copyRaw(right.accessRightType)}
                                >
                                  <Copy className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-sm text-muted-foreground">
                              {formatDate(right.createdAt)}
                            </td>
                            <td className="px-3 py-2 text-sm text-muted-foreground">
                              {right.expiresAt ? formatDate(right.expiresAt) : '—'}
                              {isRightExpired(right) && (
                                <span className="ml-1 text-destructive">
                                  ({t('admin.accessControl.expired')})
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-sm text-muted-foreground">
                              <div className="flex items-center justify-between gap-2">
                                <span title={right.roleId ?? right.houseMemberId ?? '—'}>
                                  {getGrantedByLabel(right)}
                                </span>
                                {(right.roleId || right.houseMemberId) && (
                                  <button
                                    type="button"
                                    title={`Скопировать: ${right.roleId ?? right.houseMemberId ?? ''}`}
                                    className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                    onClick={() => copyRaw(right.roleId ?? right.houseMemberId ?? '')}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                            {onDeleteRight && (
                              <td className="px-3 py-2">
                                <AppButton
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                  disabled={deletingId === right.id}
                                  onClick={() => handleDeleteRight(right.id)}
                                >
                                  {t('admin.delete')}
                                </AppButton>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      {showAdminControls && onCreateRight && member && (
        <AccessRightFormModal
          isOpen={rightFormOpen}
          onOpenChange={setRightFormOpen}
          houseId={member.houseId ?? ''}
          initialHouseMemberId={member.id}
          onSubmit={handleCreateRight}
        />
      )}
    </Dialog>
  );
}
