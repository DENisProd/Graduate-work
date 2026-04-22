'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, User } from 'lucide-react';
import { AppButton } from '@/components/ui/app-button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from '@/hooks';
import { useToast } from '@/components/shared';
import { ApiError, houseRolesApi, housesApi } from '@/lib/api-client';
import type {
  CreatePolicyRequestDto,
  CreateResourceRequestDto,
  HousePolicyResponse,
  HouseRoleCreateRequest,
  HouseRoleResponse,
  HouseResourceTreeNode,
  RoleMemberResponse,
} from '@/types/api';
import { CreateRoleModal } from '../../modals/CreateRoleModal';
import { EditRoleModal } from '../../modals/EditRoleModal';

interface RolesTabProps {
  houseId: string | null;
  activeTab: string;
  /** Скрыть кнопку Create Role если нет прав (FE-ROLES-017). По умолчанию true. */
  canEditRoles?: boolean;
}

const SKELETON_ROWS = 5;
const RESOURCE_TYPES: CreateResourceRequestDto['type'][] = [
  'ROOM',
  'DEVICE',
  'DEVICE_FUNCTION',
  'SCENE',
  'GROUP',
  'AUTOMATION',
];
const POLICY_EFFECTS: CreatePolicyRequestDto['effect'][] = ['ALLOW', 'DENY', 'READ', 'WRITE'];
const POLICY_SUBJECTS: CreatePolicyRequestDto['subjectType'][] = ['ANYONE', 'ROLE', 'MEMBER', 'USER'];

const EFFECT_LABELS: Record<CreatePolicyRequestDto['effect'], string> = {
  ALLOW: 'Разрешить',
  DENY: 'Запретить',
  READ: 'Только чтение',
  WRITE: 'Только запись',
};

const SUBJECT_LABELS: Record<CreatePolicyRequestDto['subjectType'], string> = {
  ANYONE: 'Для всех',
  ROLE: 'Для роли',
  MEMBER: 'Для участника дома',
  USER: 'Для пользователя',
};

type TreeNodeWithMeta = HouseResourceTreeNode & {
  name?: string;
  externalId?: string;
};

function flattenResources(
  nodes: TreeNodeWithMeta[],
  parentPath = ''
): Array<{ id: string; type: string; name?: string; path: string }> {
  const result: Array<{ id: string; type: string; name?: string; path: string }> = [];
  nodes.forEach((node) => {
    const id = String(node.id);
    const type = typeof node.type === 'string' ? node.type : 'RESOURCE';
    const label = node.name ?? node.externalId ?? type;
    const path = parentPath ? `${parentPath} / ${label}` : label;
    result.push({ id, type, name: node.name, path });
    if (Array.isArray(node.children) && node.children.length > 0) {
      result.push(...flattenResources(node.children as TreeNodeWithMeta[], path));
    }
  });
  return result;
}

function RolesTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead />
          <TableHead />
          <TableHead />
          <TableHead />
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
            <TableCell><Skeleton className="h-5 w-12" /></TableCell>
            <TableCell><Skeleton className="h-5 w-10" /></TableCell>
            <TableCell><Skeleton className="h-5 w-16" /></TableCell>
            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function RolesTab({ houseId, activeTab, canEditRoles = true }: RolesTabProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [roles, setRoles] = useState<HouseRoleResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createRoleModalOpen, setCreateRoleModalOpen] = useState(false);
  const [editRole, setEditRole] = useState<HouseRoleResponse | null>(null);
  const [deleteRole, setDeleteRole] = useState<HouseRoleResponse | null>(null);
  const [selectedRole, setSelectedRole] = useState<HouseRoleResponse | null>(null);
  const [roleMembers, setRoleMembers] = useState<RoleMemberResponse[]>([]);
  const [roleMembersLoading, setRoleMembersLoading] = useState(false);
  const [policies, setPolicies] = useState<HousePolicyResponse[]>([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);
  const [resourcesFlat, setResourcesFlat] = useState<Array<{ id: string; type: string; name?: string; path: string }>>([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [resourceName, setResourceName] = useState('');
  const [resourceExternalId, setResourceExternalId] = useState('');
  const [resourceType, setResourceType] = useState<CreateResourceRequestDto['type']>('ROOM');
  const [resourceParentId, setResourceParentId] = useState('');
  const [resourceCreating, setResourceCreating] = useState(false);
  const [policyName, setPolicyName] = useState('');
  const [policyEffect, setPolicyEffect] = useState<CreatePolicyRequestDto['effect']>('ALLOW');
  const [policySubjectType, setPolicySubjectType] = useState<CreatePolicyRequestDto['subjectType']>('ANYONE');
  const [policySubjectId, setPolicySubjectId] = useState('');
  const [policyResourceId, setPolicyResourceId] = useState('');
  const [policyPriority, setPolicyPriority] = useState('100');
  const [policyCondition, setPolicyCondition] = useState('');
  const [policyConditionError, setPolicyConditionError] = useState<string | null>(null);
  const [policyCreating, setPolicyCreating] = useState(false);

  const loadRoles = useCallback(
    async (signal?: AbortSignal) => {
      if (!houseId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await houseRolesApi.getHouseRoles(houseId);
        if (signal?.aborted) return;
        setRoles(Array.isArray(data) ? data : []);
      } catch (err) {
        if (signal?.aborted) return;
        setRoles([]);
        setError(err instanceof ApiError ? t('common.error') : t('common.error'));
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [houseId, t]
  );

  useEffect(() => {
    if (activeTab !== 'roles') return;
    const controller = new AbortController();
    void loadRoles(controller.signal);
    return () => controller.abort();
  }, [activeTab, loadRoles]);

  const loadRoleMembers = useCallback(
    async (roleId: string, signal?: AbortSignal) => {
      setRoleMembersLoading(true);
      setRoleMembers([]);
      try {
        const data = await houseRolesApi.getRoleMembers(roleId);
        if (signal?.aborted) return;
        setRoleMembers(Array.isArray(data) ? data : []);
      } catch {
        if (!signal?.aborted) setRoleMembers([]);
      } finally {
        if (!signal?.aborted) setRoleMembersLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const roleId = selectedRole?.id;
    if (!roleId) {
      setRoleMembers([]);
      return;
    }
    const controller = new AbortController();
    void loadRoleMembers(roleId, controller.signal);
    return () => controller.abort();
  }, [selectedRole, loadRoleMembers]);

  const loadHouseAbacContext = useCallback(
    async (targetHouseId: string, signal?: AbortSignal) => {
      setPoliciesLoading(true);
      setResourcesLoading(true);
      try {
        const [policiesResponse, resourcesResponse] = await Promise.all([
          houseRolesApi.getHousePolicies(targetHouseId),
          housesApi.getResourcesTree(targetHouseId),
        ]);
        if (signal?.aborted) return;
        const nodes = Array.isArray(resourcesResponse) ? resourcesResponse : [resourcesResponse];
        const flattened = flattenResources(nodes as TreeNodeWithMeta[]);
        setPolicies(Array.isArray(policiesResponse) ? policiesResponse : []);
        setResourcesFlat(flattened);
        setResourceParentId((prev) => prev || flattened[0]?.id || '');
      } catch {
        if (signal?.aborted) return;
        setPolicies([]);
        setResourcesFlat([]);
      } finally {
        if (!signal?.aborted) {
          setPoliciesLoading(false);
          setResourcesLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    if (activeTab !== 'roles' || !houseId) return;
    const controller = new AbortController();
    void loadHouseAbacContext(houseId, controller.signal);
    return () => controller.abort();
  }, [activeTab, houseId, loadHouseAbacContext]);

  const sortedRoles = useMemo(() => {
    return [...roles].sort((a, b) => {
      if (a.system && !b.system) return -1;
      if (!a.system && b.system) return 1;
      const pa = a.priority ?? 999;
      const pb = b.priority ?? 999;
      return pa - pb;
    });
  }, [roles]);

  const relatedPolicies = useMemo(() => {
    if (!selectedRole) return [];
    return policies
      .filter((policy) => policy.subjectType === 'ROLE' && policy.subjectId === selectedRole.id)
      .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
  }, [policies, selectedRole]);

  const relatedResources = useMemo(() => {
    const ids = new Set(
      relatedPolicies
        .map((policy) => policy.resourceId)
        .filter((value): value is string => typeof value === 'string' && value.length > 0)
    );
    return Array.from(ids).map((resourceId) => {
      const node = resourcesFlat.find((resource) => resource.id === resourceId);
      return {
        id: resourceId,
        type: node?.type,
        path: node?.path,
      };
    });
  }, [relatedPolicies, resourcesFlat]);

  const sortedPolicies = useMemo(
    () => [...policies].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999)),
    [policies]
  );
  const resourcesById = useMemo(
    () => new Map(resourcesFlat.map((resource) => [resource.id, resource])),
    [resourcesFlat]
  );

  if (activeTab !== 'roles') return null;

  const handleCreateRole = async (data: HouseRoleCreateRequest) => {
    if (!houseId) throw new Error('No houseId');
    const created = await houseRolesApi.createRole(houseId, data);
    setRoles((prev) => [...prev, created]);
  };

  const handleEditRole = async (roleId: string, data: HouseRoleCreateRequest) => {
    const updated = await houseRolesApi.updateRole(roleId, data);
    setRoles((prev) =>
      prev.map((r) => (r.id === roleId ? updated : r))
    );
    return updated;
  };

  const handleConfirmDelete = async () => {
    if (!deleteRole) return;
    try {
      await houseRolesApi.deleteRole(deleteRole.id);
      setRoles((prev) => prev.filter((r) => r.id !== deleteRole.id));
      if (selectedRole?.id === deleteRole.id) setSelectedRole(null);
      setDeleteRole(null);
      showToast(t('admin.accessControl.roleDeleted'), 'success');
    } catch {
      showToast(t('common.error'), 'error');
    }
  };

  const handleCreateResource = async () => {
    if (!houseId || !resourceParentId) return;
    setResourceCreating(true);
    try {
      await houseRolesApi.createResource({
        type: resourceType,
        parentId: resourceParentId,
        ...(resourceName.trim() ? { name: resourceName.trim() } : {}),
        ...(resourceExternalId.trim() ? { externalId: resourceExternalId.trim() } : {}),
      });
      await loadHouseAbacContext(houseId);
      setResourceName('');
      setResourceExternalId('');
      showToast('Ресурс успешно создан', 'success');
    } catch {
      showToast(t('common.error'), 'error');
    } finally {
      setResourceCreating(false);
    }
  };

  const handleCreatePolicy = async () => {
    if (!houseId || !policyName.trim() || !policyResourceId) return;
    setPolicyCreating(true);
    setPolicyConditionError(null);
    try {
      let parsedCondition: Record<string, unknown> | undefined;
      if (policyCondition.trim()) {
        try {
          parsedCondition = JSON.parse(policyCondition) as Record<string, unknown>;
        } catch {
          setPolicyConditionError('Условие должно быть валидным JSON');
          setPolicyCreating(false);
          return;
        }
      }
      await houseRolesApi.createPolicy({
        name: policyName.trim(),
        effect: policyEffect,
        subjectType: policySubjectType,
        ...(policySubjectType !== 'ANYONE' && policySubjectId.trim()
          ? { subjectId: policySubjectId.trim() }
          : {}),
        resourceId: policyResourceId,
        priority: Number(policyPriority) || 100,
        ...(parsedCondition ? { condition: parsedCondition } : {}),
      });
      await loadHouseAbacContext(houseId);
      setPolicyName('');
      setPolicyCondition('');
      setPolicySubjectId('');
      setPolicyPriority('100');
      showToast('Политика успешно создана', 'success');
    } catch {
      showToast(t('common.error'), 'error');
    } finally {
      setPolicyCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">
          {t('admin.accessControl.roles')}
        </h3>
        {canEditRoles && (
          <AppButton
            size="sm"
            onClick={() => setCreateRoleModalOpen(true)}
            disabled={!houseId}
          >
            <Plus className="size-4" />
            {t('admin.accessControl.createRole')}
          </AppButton>
        )}
      </div>
      {loading ? (
        <RolesTableSkeleton />
      ) : error ? (
        <div className="space-y-3 rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
          <AppButton variant="secondary" size="sm" onClick={() => loadRoles()}>
            {t('admin.retry')}
          </AppButton>
        </div>
      ) : roles.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm font-medium text-foreground">
            {t('admin.accessControl.noRoles')}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('admin.accessControl.noRolesDescription')}
          </p>
          {canEditRoles && (
            <AppButton
              className="mt-4"
              size="sm"
              onClick={() => setCreateRoleModalOpen(true)}
              disabled={!houseId}
            >
              <Plus className="size-4" />
              {t('admin.accessControl.createRole')}
            </AppButton>
          )}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr,minmax(280px,360px)]">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.accessControl.rolesTableRole')}</TableHead>
              <TableHead>{t('admin.accessControl.rolesTablePriority')}</TableHead>
              <TableHead>{t('admin.accessControl.rolesTableUsers')}</TableHead>
              <TableHead>{t('admin.accessControl.rolesTableSystem')}</TableHead>
              <TableHead>{t('admin.accessControl.rolesTableActions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRoles.map((role) => (
              <TableRow
                key={role.id}
                className="cursor-pointer"
                onClick={() => setSelectedRole(role)}
                data-state={selectedRole?.id === role.id ? 'selected' : undefined}
              >
                <TableCell>
                  {role.name ?? role.code ?? role.id}
                </TableCell>
                <TableCell>
                  {role.priority !== undefined ? role.priority : '—'}
                </TableCell>
                <TableCell>
                  {role.memberCount !== undefined ? role.memberCount : '—'}
                </TableCell>
                <TableCell>
                  {role.system ? t('admin.accessControl.rolesTableSystem') : '—'}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  {canEditRoles && !role.system && (
                    <div className="flex items-center gap-1">
                      <AppButton
                        size="sm"
                        variant="secondary"
                        onClick={() => setEditRole(role)}
                        aria-label={t('admin.edit')}
                      >
                        <Pencil className="size-4" />
                      </AppButton>
                      <AppButton
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteRole(role)}
                        aria-label={t('admin.delete')}
                      >
                        <Trash2 className="size-4" />
                      </AppButton>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {selectedRole && (
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
              <div>
                <dt className="text-muted-foreground">{t('admin.accessControl.rolesTableSystem')}</dt>
                <dd className="font-medium">
                  {selectedRole.system ? t('admin.accessControl.rolesTableSystem') : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t('admin.accessControl.rolesTableUsers')}</dt>
                <dd className="font-medium">{selectedRole.memberCount ?? 0}</dd>
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
              {roleMembersLoading ? (
                <div className="mt-2 flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ) : roleMembers.length === 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">{t('admin.noData')}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-9" />
                      <TableHead>{t('admin.accessControl.members')}</TableHead>
                      <TableHead>{t('admin.accessControl.email')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roleMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="w-9">
                          {member.avatarUrl ? (
                            <img
                              src={member.avatarUrl}
                              alt=""
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                              <User className="size-4 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{member.name ?? member.userId ?? member.id}</TableCell>
                        <TableCell className="text-muted-foreground">{member.email ?? '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        )}
      </div>
      )}
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <h4 className="text-sm font-semibold text-foreground">Политики доступа (ABAC)</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Создайте правило: кому, на какой ресурс и с каким типом доступа.
          </p>
          <div className="mt-3 grid gap-2">
            <Input
              placeholder="Название политики (например: Доступ к камерам ночью)"
              value={policyName}
              onChange={(event) => setPolicyName(event.target.value)}
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <Select value={policyEffect} onValueChange={(value: CreatePolicyRequestDto['effect']) => setPolicyEffect(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Тип доступа" />
                </SelectTrigger>
                <SelectContent>
                  {POLICY_EFFECTS.map((effect) => (
                    <SelectItem key={effect} value={effect}>
                      {EFFECT_LABELS[effect]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Приоритет (меньше = важнее)"
                value={policyPriority}
                onChange={(event) => setPolicyPriority(event.target.value)}
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Select
                value={policySubjectType}
                onValueChange={(value: CreatePolicyRequestDto['subjectType']) => setPolicySubjectType(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Для кого правило" />
                </SelectTrigger>
                <SelectContent>
                  {POLICY_SUBJECTS.map((subjectType) => (
                    <SelectItem key={subjectType} value={subjectType}>
                      {SUBJECT_LABELS[subjectType]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="ID пользователя / роли / участника"
                value={policySubjectId}
                onChange={(event) => setPolicySubjectId(event.target.value)}
                disabled={policySubjectType === 'ANYONE'}
              />
            </div>
            <Select value={policyResourceId} onValueChange={setPolicyResourceId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Выберите ресурс" />
              </SelectTrigger>
              <SelectContent>
                {resourcesFlat.map((resource) => (
                  <SelectItem key={resource.id} value={resource.id}>
                    {resource.path} ({resource.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              placeholder='Условие (необязательно), JSON. Пример: {"timeFrom":"08:00","timeTo":"23:00"}'
              value={policyCondition}
              onChange={(event) => {
                setPolicyCondition(event.target.value);
                if (policyConditionError) setPolicyConditionError(null);
              }}
              rows={3}
            />
            {policyConditionError && (
              <p className="text-xs text-destructive">{policyConditionError}</p>
            )}
            <AppButton
              size="sm"
              onClick={handleCreatePolicy}
              disabled={!houseId || policyCreating || !policyName.trim() || !policyResourceId}
            >
              Создать политику
            </AppButton>
          </div>
          <div className="mt-4 border-t border-border pt-3">
            <p className="text-xs font-medium text-muted-foreground">Политики этого дома</p>
            {policiesLoading ? (
              <div className="mt-2 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : sortedPolicies.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">{t('admin.noData')}</p>
            ) : (
              <div className="mt-2 space-y-2">
                {sortedPolicies.map((policy) => (
                  <div key={policy.id} className="rounded-md border border-border p-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-foreground">{policy.name ?? policy.id}</span>
                      <Badge variant="outline">
                        {policy.effect && policy.effect in EFFECT_LABELS
                          ? EFFECT_LABELS[policy.effect as CreatePolicyRequestDto['effect']]
                          : policy.effect ?? 'Не задано'}
                      </Badge>
                      <Badge variant="secondary">
                        {policy.subjectType && policy.subjectType in SUBJECT_LABELS
                          ? SUBJECT_LABELS[policy.subjectType as CreatePolicyRequestDto['subjectType']]
                          : policy.subjectType ?? 'Не задано'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Ресурс:{' '}
                      {policy.resourceId
                        ? (resourcesById.get(policy.resourceId)?.path ?? policy.resourceId)
                        : '—'}
                      {' '}· Приоритет: {policy.priority ?? '—'}
                    </p>
                    {policy.subjectId && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Кому: {policy.subjectId}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h4 className="text-sm font-semibold text-foreground">Ресурсы дома (ABAC)</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Добавьте ресурс в дерево дома, чтобы к нему можно было привязать политику.
          </p>
          <div className="mt-3 grid gap-2">
            <Input
              placeholder="Название ресурса (например: Камера у входа)"
              value={resourceName}
              onChange={(event) => setResourceName(event.target.value)}
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <Select value={resourceType} onValueChange={(value: CreateResourceRequestDto['type']) => setResourceType(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Тип ресурса" />
                </SelectTrigger>
                <SelectContent>
                  {RESOURCE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Внешний ID (необязательно)"
                value={resourceExternalId}
                onChange={(event) => setResourceExternalId(event.target.value)}
              />
            </div>
            <Select value={resourceParentId} onValueChange={setResourceParentId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Родительский ресурс" />
              </SelectTrigger>
              <SelectContent>
                {resourcesFlat.map((resource) => (
                  <SelectItem key={resource.id} value={resource.id}>
                    {resource.path} ({resource.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <AppButton
              size="sm"
              onClick={handleCreateResource}
              disabled={!houseId || resourceCreating || !resourceParentId}
            >
              Создать ресурс
            </AppButton>
          </div>
          <div className="mt-4 border-t border-border pt-3">
            <p className="text-xs font-medium text-muted-foreground">Текущее дерево ресурсов</p>
            {resourcesLoading ? (
              <div className="mt-2 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : resourcesFlat.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">{t('admin.noData')}</p>
            ) : (
              <div className="mt-2 max-h-64 space-y-2 overflow-auto pr-1">
                {resourcesFlat.map((resource) => (
                  <div key={resource.id} className="rounded-md border border-border p-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{resource.type}</Badge>
                      <span className="text-xs text-foreground">{resource.path}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">id: {resource.id}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <CreateRoleModal
        isOpen={createRoleModalOpen}
        onOpenChange={setCreateRoleModalOpen}
        houseId={houseId}
        onSubmit={handleCreateRole}
      />
      <EditRoleModal
        isOpen={!!editRole}
        onOpenChange={(open) => !open && setEditRole(null)}
        role={editRole}
        onSubmit={handleEditRole}
      />
      <Dialog open={!!deleteRole} onOpenChange={(open) => !open && setDeleteRole(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('admin.accessControl.deleteRoleConfirmTitle')}</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            {deleteRole && (
              <>
                {t('admin.accessControl.deleteRoleConfirmMessage')} &quot;{deleteRole.name ?? deleteRole.code ?? deleteRole.id}&quot;?
              </>
            )}
          </DialogDescription>
          <DialogFooter>
            <AppButton variant="secondary" onClick={() => setDeleteRole(null)}>
              {t('common.cancel')}
            </AppButton>
            <AppButton variant="destructive" onClick={handleConfirmDelete}>
              {t('admin.delete')}
            </AppButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
