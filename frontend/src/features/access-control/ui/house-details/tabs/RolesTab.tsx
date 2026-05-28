'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { AppButton } from '@/components/ui/app-button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
import { ApiError, houseMembersApi, houseRolesApi, housesApi } from '@/lib/api-client';
import type {
  CreatePolicyRequestDto,
  CreateResourceRequestDto,
  HousePolicyResponse,
  HouseRoleCreateRequest,
  HouseRoleResponse,
  RoleMemberResponse,
} from '@/types/api';
import { CreateRoleModal } from '../../modals/CreateRoleModal';
import { EditRoleModal } from '../../modals/EditRoleModal';
import { flattenResources, type TreeNodeWithMeta } from './roles/roles-helpers';
import { RolesTable } from './roles/RolesTable';
import { RoleDetailsPanel } from './roles/RoleDetailsPanel';

interface RolesTabProps {
  houseId: string | null;
  activeTab: string;
  /** Скрыть кнопку Create Role если нет прав (FE-ROLES-017). По умолчанию true. */
  canEditRoles?: boolean;
}

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

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  HOUSE: 'Дом',
  ROOM: 'Комната',
  DEVICE: 'Устройство',
  DEVICE_FUNCTION: 'Функция устройства',
  SCENE: 'Сцена',
  GROUP: 'Группа',
  AUTOMATION: 'Автоматизация',
};

const VALID_PARENT_TYPES: Record<CreateResourceRequestDto['type'], string[]> = {
  HOUSE: [],
  ROOM: ['HOUSE'],
  DEVICE: ['ROOM'],
  DEVICE_FUNCTION: ['DEVICE'],
  SCENE: ['HOUSE', 'ROOM'],
  GROUP: ['HOUSE', 'ROOM'],
  AUTOMATION: ['HOUSE', 'ROOM'],
};

export function RolesTab({ houseId, activeTab, canEditRoles = true }: RolesTabProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [roles, setRoles] = useState<HouseRoleResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roleMemberCounts, setRoleMemberCounts] = useState<Record<string, number>>({});
  const [roleMemberPreviews, setRoleMemberPreviews] = useState<
    Record<string, Array<{ id: string; name?: string; avatarUrl?: string }>>
  >({});
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
  const [resourceType, setResourceType] = useState<CreateResourceRequestDto['type']>('ROOM');
  const [resourceParentId, setResourceParentId] = useState('');
  const [resourceCreating, setResourceCreating] = useState(false);
  const [policyName, setPolicyName] = useState('');
  const [policyEffect, setPolicyEffect] = useState<CreatePolicyRequestDto['effect']>('ALLOW');
  const [policySubjectType, setPolicySubjectType] = useState<CreatePolicyRequestDto['subjectType']>('ANYONE');
  const [policySubjectId, setPolicySubjectId] = useState('');
  const [policyResourceId, setPolicyResourceId] = useState('');
  const [conditionTimeFrom, setConditionTimeFrom] = useState('');
  const [conditionTimeTo, setConditionTimeTo] = useState('');
  const [policyCreating, setPolicyCreating] = useState(false);
  const [houseMembers, setHouseMembers] = useState<Array<{ id: string; name?: string }>>([]);

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

  const loadRoleMemberCounts = useCallback(
    async (signal?: AbortSignal) => {
      if (!houseId) return;
      try {
        const members = await houseMembersApi.getByHouseId(houseId);
        if (signal?.aborted) return;
        const counts: Record<string, number> = {};
        const previews: Record<string, Array<{ id: string; name?: string; avatarUrl?: string }>> = {};
        const data = members as unknown;
        const items =
          Array.isArray(data)
            ? data
            : typeof data === 'object' && data !== null && 'content' in data
              ? (data as { content?: unknown }).content
              : undefined;
        if (!Array.isArray(items)) {
          setRoleMemberCounts({});
          setRoleMemberPreviews({});
          return;
        }
        const membersList: Array<{ id: string; name?: string }> = [];
        for (const m of items as Array<Record<string, unknown>>) {
          const rolesArr = m.roles;
          const memberId = typeof m.id === 'string' ? m.id : String(m.id ?? '');
          const name = typeof m.userDisplayName === 'string' ? m.userDisplayName : undefined;
          const avatarUrl = typeof m.userAvatarUrl === 'string' ? m.userAvatarUrl : undefined;
          if (memberId) membersList.push({ id: memberId, name });
          if (!Array.isArray(rolesArr)) continue;
          for (const mr of rolesArr as Array<Record<string, unknown>>) {
            const roleId = typeof mr.roleId === 'string' ? mr.roleId : String(mr.roleId ?? '');
            if (!roleId) continue;
            counts[roleId] = (counts[roleId] ?? 0) + 1;
            const list = (previews[roleId] ??= []);
            if (list.length < 5) {
              list.push({ id: memberId || `${roleId}:${list.length}`, name, avatarUrl });
            }
          }
        }
        setRoleMemberCounts(counts);
        setRoleMemberPreviews(previews);
        setHouseMembers(membersList);
      } catch {
        if (!signal?.aborted) {
          setRoleMemberCounts({});
          setRoleMemberPreviews({});
        }
      }
    },
    [houseId],
  );

  useEffect(() => {
    if (activeTab !== 'roles') return;
    const controller = new AbortController();
    void loadRoleMemberCounts(controller.signal);
    return () => controller.abort();
  }, [activeTab, loadRoleMemberCounts]);

  const loadRoleMembers = useCallback(
    async (roleId: string, signal?: AbortSignal) => {
      if (!houseId) return;
      setRoleMembersLoading(true);
      setRoleMembers([]);
      try {
        const data = await houseRolesApi.getRoleMembers(houseId, roleId);
        if (signal?.aborted) return;
        setRoleMembers(Array.isArray(data) ? data : []);
      } catch {
        if (!signal?.aborted) setRoleMembers([]);
      } finally {
        if (!signal?.aborted) setRoleMembersLoading(false);
      }
    },
    [houseId]
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

  const validParentResources = useMemo(() => {
    const allowed = VALID_PARENT_TYPES[resourceType] ?? [];
    return resourcesFlat.filter((r) => allowed.includes(r.type));
  }, [resourcesFlat, resourceType]);

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
      });
      await loadHouseAbacContext(houseId);
      setResourceName('');
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
    try {
      const condition: Record<string, unknown> = {};
      if (conditionTimeFrom) condition.timeFrom = conditionTimeFrom;
      if (conditionTimeTo) condition.timeTo = conditionTimeTo;
      await houseRolesApi.createPolicy({
        name: policyName.trim(),
        effect: policyEffect,
        subjectType: policySubjectType,
        ...(policySubjectType !== 'ANYONE' && policySubjectId.trim()
          ? { subjectId: policySubjectId.trim() }
          : {}),
        resourceId: policyResourceId,
        priority: 100,
        ...(Object.keys(condition).length > 0 ? { condition } : {}),
      });
      await loadHouseAbacContext(houseId);
      setPolicyName('');
      setConditionTimeFrom('');
      setConditionTimeTo('');
      setPolicySubjectId('');
      showToast('Политика успешно создана', 'success');
    } catch {
      showToast(t('common.error'), 'error');
    } finally {
      setPolicyCreating(false);
    }
  };

  return (
    <Tabs defaultValue="roles">
      <TabsList>
        <TabsTrigger value="roles" className="data-[state=active]:text-background">{t('admin.accessControl.roles')}</TabsTrigger>
        <TabsTrigger value="policies" className="data-[state=active]:text-background">Политики</TabsTrigger>
        <TabsTrigger value="resources" className="data-[state=active]:text-background">Ресурсы</TabsTrigger>
      </TabsList>

      {/* ── Роли ── */}
      <TabsContent value="roles" className="mt-4 min-h-[280px] space-y-4">
        {canEditRoles && (
          <div className="flex justify-end">
            <AppButton size="sm" onClick={() => setCreateRoleModalOpen(true)} disabled={!houseId}>
              <Plus className="size-4" />
              {t('admin.accessControl.createRole')}
            </AppButton>
          </div>
        )}
        {loading && roles.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          </div>
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
            <div>
              <RolesTable
                roles={sortedRoles}
                selectedRoleId={selectedRole?.id ?? null}
                canEditRoles={canEditRoles}
                roleMemberCounts={roleMemberCounts}
                roleMemberPreviews={roleMemberPreviews}
                onSelectRole={setSelectedRole}
                onEditRole={setEditRole}
                onDeleteRole={setDeleteRole}
              />
              {loading && (
                <div className="mt-3 flex items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
                </div>
              )}
            </div>
            {selectedRole && (
              <RoleDetailsPanel
                selectedRole={selectedRole}
                policiesLoading={policiesLoading}
                resourcesLoading={resourcesLoading}
                roleMembersLoading={roleMembersLoading}
                roleMembers={roleMembers}
                relatedPolicies={relatedPolicies}
                relatedResources={relatedResources}
              />
            )}
          </div>
        )}
      </TabsContent>

      {/* ── Политики ── */}
      <TabsContent value="policies" className="mt-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <h4 className="text-sm font-semibold text-foreground">Политики доступа</h4>
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
              <Select
                value={policySubjectType}
                onValueChange={(value: CreatePolicyRequestDto['subjectType']) => {
                  setPolicySubjectType(value);
                  setPolicySubjectId('');
                }}
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
            </div>
            {policySubjectType === 'ROLE' && (
              <Select value={policySubjectId} onValueChange={setPolicySubjectId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Выберите роль" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name ?? role.code ?? role.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {(policySubjectType === 'MEMBER' || policySubjectType === 'USER') && (
              <Select value={policySubjectId} onValueChange={setPolicySubjectId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Выберите участника" />
                </SelectTrigger>
                <SelectContent>
                  {houseMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name ?? member.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={policyResourceId} onValueChange={setPolicyResourceId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Выберите ресурс" />
              </SelectTrigger>
              <SelectContent>
                {resourcesFlat.map((resource) => (
                  <SelectItem key={resource.id} value={resource.id}>
                    {resource.path} ({RESOURCE_TYPE_LABELS[resource.type] ?? resource.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Активно с (необязательно)</p>
                <Input
                  type="time"
                  value={conditionTimeFrom}
                  onChange={(event) => setConditionTimeFrom(event.target.value)}
                />
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Активно до (необязательно)</p>
                <Input
                  type="time"
                  value={conditionTimeTo}
                  onChange={(event) => setConditionTimeTo(event.target.value)}
                />
              </div>
            </div>
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
                {sortedPolicies.map((policy) => {
                  let subjectName: string | undefined;
                  if (policy.subjectType === 'ROLE') {
                    const role = roles.find((r) => r.id === policy.subjectId);
                    subjectName = role ? (role.name ?? role.code) : policy.subjectId;
                  } else if (policy.subjectType === 'MEMBER' || policy.subjectType === 'USER') {
                    const member = houseMembers.find((m) => m.id === policy.subjectId);
                    subjectName = member?.name ?? policy.subjectId;
                  }
                  const timeFrom = policy.condition?.timeFrom as string | undefined;
                  const timeTo = policy.condition?.timeTo as string | undefined;
                  return (
                    <div key={policy.id} className="rounded-md border border-border p-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-foreground">{policy.name ?? '—'}</span>
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
                          ? (resourcesById.get(policy.resourceId)?.path ?? '—')
                          : '—'}
                      </p>
                      {subjectName && (
                        <p className="mt-0.5 text-xs text-muted-foreground">Кому: {subjectName}</p>
                      )}
                      {(timeFrom ?? timeTo) && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Время: {timeFrom ?? '...'} — {timeTo ?? '...'}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </TabsContent>

      {/* ── Ресурсы ── */}
      <TabsContent value="resources" className="mt-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <h4 className="text-sm font-semibold text-foreground">Ресурсы дома</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Добавьте ресурс в дерево дома, чтобы к нему можно было привязать политику.
          </p>
          <div className="mt-3 grid gap-2">
            <Input
              placeholder="Название ресурса (например: Камера у входа)"
              value={resourceName}
              onChange={(event) => setResourceName(event.target.value)}
            />
            <Select
              value={resourceType}
              onValueChange={(value: CreateResourceRequestDto['type']) => {
                setResourceType(value);
                setResourceParentId('');
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Тип ресурса" />
              </SelectTrigger>
              <SelectContent>
                {RESOURCE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {RESOURCE_TYPE_LABELS[type] ?? type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={resourceParentId} onValueChange={setResourceParentId}>
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    validParentResources.length === 0
                      ? 'Нет подходящих родительских ресурсов'
                      : 'Выберите родительский ресурс'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {validParentResources.map((resource) => (
                  <SelectItem key={resource.id} value={resource.id}>
                    {resource.path} ({RESOURCE_TYPE_LABELS[resource.type] ?? resource.type})
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
                      <Badge variant="outline">{RESOURCE_TYPE_LABELS[resource.type] ?? resource.type}</Badge>
                      <span className="text-xs text-foreground">{resource.path}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </TabsContent>
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
    </Tabs>
  );
}
