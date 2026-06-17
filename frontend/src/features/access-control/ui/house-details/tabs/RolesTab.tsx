'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Info, Plus } from 'lucide-react';
import { AppButton } from '@/components/ui/app-button';
import { Input } from '@/components/ui/input';
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
import { ResourceTreeView } from './roles/ResourceTreeView';
import { PolicyListPanel } from './roles/PolicyListPanel';

interface RolesTabProps {
  houseId: string | null;
  activeTab: string;
  /** Скрыть кнопку Create Role если нет прав (FE-ROLES-017). По умолчанию true. */
  canEditRoles?: boolean;
}

const RESOURCE_TYPES = [
  'ROOM',
  'DEVICE',
  'DEVICE_FUNCTION',
  'SCENE',
  'GROUP',
  'AUTOMATION',
] as const satisfies readonly CreateResourceRequestDto['type'][];
type CreatableResourceType = (typeof RESOURCE_TYPES)[number];
const POLICY_EFFECTS: CreatePolicyRequestDto['effect'][] = ['ALLOW', 'DENY', 'READ', 'WRITE'];
const POLICY_SUBJECTS: CreatePolicyRequestDto['subjectType'][] = ['ANYONE', 'ROLE', 'MEMBER', 'USER'];

const EFFECT_LABELS: Record<CreatePolicyRequestDto['effect'], string> = {
  ALLOW: 'Разрешить',
  DENY: 'Запретить',
  READ: 'Только просмотр',
  WRITE: 'Только управление',
};

const EFFECT_HINTS: Record<CreatePolicyRequestDto['effect'], string> = {
  ALLOW: 'Можно пользоваться объектом полностью',
  DENY: 'Доступ к объекту полностью закрыт',
  READ: 'Можно только смотреть, но не управлять',
  WRITE: 'Можно управлять, но не менять настройки',
};

const SUBJECT_LABELS: Record<CreatePolicyRequestDto['subjectType'], string> = {
  ANYONE: 'Все пользователи',
  ROLE: 'Участники с ролью',
  MEMBER: 'Конкретный участник',
  USER: 'Конкретный пользователь',
};

const SUBJECT_HINTS: Record<CreatePolicyRequestDto['subjectType'], string> = {
  ANYONE: 'Правило действует для всех, кто имеет доступ к дому',
  ROLE: 'Например, только для гостей или детей',
  MEMBER: 'Выберите одного человека из списка участников дома',
  USER: 'Привязка к конкретному аккаунту пользователя',
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

const RESOURCE_TYPE_HINTS: Record<CreatableResourceType, string> = {
  ROOM: 'Комната или зона — например, «Кухня» или «Спальня»',
  DEVICE: 'Конкретное устройство — лампа, розетка, камера и т.д.',
  DEVICE_FUNCTION: 'Отдельная возможность устройства — яркость, цвет, режим',
  SCENE: 'Готовый режим — «Вечер», «Кино», «Уборка»',
  GROUP: 'Несколько устройств, которыми можно управлять вместе',
  AUTOMATION: 'Правило «если…, то…» — например, включить свет по датчику',
};

const PARENT_SELECTOR_HINTS: Record<CreatableResourceType, string> = {
  ROOM: 'Комната добавляется в структуру дома',
  DEVICE: 'Укажите комнату, где находится устройство',
  DEVICE_FUNCTION: 'Выберите устройство, к которому относится функция',
  SCENE: 'Сцену можно привязать ко всему дому или к комнате',
  GROUP: 'Группу можно создать для дома или для одной комнаты',
  AUTOMATION: 'Автоматизацию можно привязать к дому или к комнате',
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
  const [resourcesTree, setResourcesTree] = useState<TreeNodeWithMeta[]>([]);
  const [resourcesFlat, setResourcesFlat] = useState<Array<{ id: string; type: string; name?: string; path: string }>>([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [resourceName, setResourceName] = useState('');
  const [resourceType, setResourceType] = useState<CreatableResourceType>('ROOM');
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
        const typedNodes = nodes as TreeNodeWithMeta[];
        const flattened = flattenResources(typedNodes);
        setPolicies(Array.isArray(policiesResponse) ? policiesResponse : []);
        setResourcesTree(typedNodes);
        setResourcesFlat(flattened);
        setResourceParentId((prev) => prev || flattened[0]?.id || '');
      } catch {
        if (signal?.aborted) return;
        setPolicies([]);
        setResourcesTree([]);
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

  useEffect(() => {
    if (validParentResources.length === 0) {
      setResourceParentId('');
      return;
    }
    const currentParentValid = validParentResources.some((resource) => resource.id === resourceParentId);
    if (!currentParentValid) {
      setResourceParentId(validParentResources[0].id);
    }
  }, [resourceType, validParentResources, resourceParentId]);

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
        <div className="mb-4 flex gap-3 rounded-xl border border-border bg-muted/30 p-4">
          <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <div className="space-y-1 text-sm">
            <p className="font-medium text-foreground">Правила доступа</p>
            <p className="text-muted-foreground">
              Здесь вы решаете, кто и что может делать в доме: пользоваться устройствами, смотреть
              камеры или менять настройки. Сначала добавьте объекты на вкладке «Ресурсы», затем
              создайте правило.
            </p>
            <p className="text-xs text-muted-foreground">
              Пример: <span className="text-foreground">Гостям запрещён доступ к камерам с 22:00 до 08:00</span>
            </p>
          </div>
        </div>

        <div className="grid min-h-[calc(100vh-16rem)] gap-4 lg:grid-cols-[minmax(300px,380px),1fr]">
          <div className="h-fit rounded-xl border border-border bg-card p-4">
            <h4 className="text-sm font-semibold text-foreground">Новое правило</h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Заполните поля по порядку — система подскажет, что означает каждый пункт.
            </p>
            <div className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="policy-name" className="text-sm font-medium text-foreground">
                  Название правила
                </label>
                <Input
                  id="policy-name"
                  placeholder="Например: Доступ к камерам ночью"
                  value={policyName}
                  onChange={(event) => setPolicyName(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Короткое название, чтобы потом легко найти правило в списке
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="policy-effect" className="text-sm font-medium text-foreground">
                  Что делать?
                </label>
                <Select
                  value={policyEffect}
                  onValueChange={(value: CreatePolicyRequestDto['effect']) => setPolicyEffect(value)}
                >
                  <SelectTrigger id="policy-effect" className="w-full">
                    <SelectValue placeholder="Выберите действие" />
                  </SelectTrigger>
                  <SelectContent>
                    {POLICY_EFFECTS.map((effect) => (
                      <SelectItem key={effect} value={effect}>
                        {EFFECT_LABELS[effect]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{EFFECT_HINTS[policyEffect]}</p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="policy-subject-type" className="text-sm font-medium text-foreground">
                  Для кого?
                </label>
                <Select
                  value={policySubjectType}
                  onValueChange={(value: CreatePolicyRequestDto['subjectType']) => {
                    setPolicySubjectType(value);
                    setPolicySubjectId('');
                  }}
                >
                  <SelectTrigger id="policy-subject-type" className="w-full">
                    <SelectValue placeholder="Выберите, для кого правило" />
                  </SelectTrigger>
                  <SelectContent>
                    {POLICY_SUBJECTS.map((subjectType) => (
                      <SelectItem key={subjectType} value={subjectType}>
                        {SUBJECT_LABELS[subjectType]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{SUBJECT_HINTS[policySubjectType]}</p>
              </div>

              {policySubjectType === 'ROLE' && (
                <div className="space-y-1.5">
                  <label htmlFor="policy-role" className="text-sm font-medium text-foreground">
                    Какая роль?
                  </label>
                  <Select value={policySubjectId} onValueChange={setPolicySubjectId}>
                    <SelectTrigger id="policy-role" className="w-full">
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
                </div>
              )}

              {(policySubjectType === 'MEMBER' || policySubjectType === 'USER') && (
                <div className="space-y-1.5">
                  <label htmlFor="policy-member" className="text-sm font-medium text-foreground">
                    Кто именно?
                  </label>
                  <Select value={policySubjectId} onValueChange={setPolicySubjectId}>
                    <SelectTrigger id="policy-member" className="w-full">
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
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="policy-resource" className="text-sm font-medium text-foreground">
                  К какому объекту?
                </label>
                <Select value={policyResourceId} onValueChange={setPolicyResourceId}>
                  <SelectTrigger id="policy-resource" className="w-full">
                    <SelectValue placeholder="Выберите объект из структуры дома" />
                  </SelectTrigger>
                  <SelectContent>
                    {resourcesFlat.map((resource) => (
                      <SelectItem key={resource.id} value={resource.id}>
                        {resource.path}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {resourcesFlat.length === 0
                    ? 'Сначала добавьте объекты на вкладке «Ресурсы»'
                    : 'Комната, устройство или другой элемент из структуры дома'}
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="text-sm font-medium text-foreground">Когда действует? (необязательно)</p>
                <p className="text-xs text-muted-foreground">
                  Оставьте пустым, если правило должно работать всегда
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label htmlFor="policy-time-from" className="text-xs text-muted-foreground">
                      С
                    </label>
                    <Input
                      id="policy-time-from"
                      type="time"
                      value={conditionTimeFrom}
                      onChange={(event) => setConditionTimeFrom(event.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="policy-time-to" className="text-xs text-muted-foreground">
                      До
                    </label>
                    <Input
                      id="policy-time-to"
                      type="time"
                      value={conditionTimeTo}
                      onChange={(event) => setConditionTimeTo(event.target.value)}
                    />
                  </div>
                </div>
              </div>

              <AppButton
                className="w-full sm:w-auto"
                size="sm"
                onClick={handleCreatePolicy}
                disabled={
                  !houseId ||
                  policyCreating ||
                  !policyName.trim() ||
                  !policyResourceId ||
                  ((policySubjectType === 'ROLE' ||
                    policySubjectType === 'MEMBER' ||
                    policySubjectType === 'USER') &&
                    !policySubjectId)
                }
              >
                {policyCreating ? 'Сохраняем…' : 'Добавить правило'}
              </AppButton>
            </div>
          </div>

          <div className="flex min-h-[24rem] flex-col rounded-xl border border-border bg-card p-4 lg:min-h-0">
            <div className="shrink-0">
              <h4 className="text-sm font-semibold text-foreground">Правила этого дома</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                Все активные ограничения и разрешения. Каждая карточка — понятное описание того, что
                разрешено или запрещено.
              </p>
            </div>
            <div className="mt-3 min-h-0 flex-1 overflow-auto rounded-lg border border-border bg-muted/20 pr-1">
              <PolicyListPanel
                policies={sortedPolicies}
                roles={roles}
                houseMembers={houseMembers}
                resourcesById={resourcesById}
                loading={policiesLoading}
                emptyMessage="Правил пока нет. Создайте первое правило с помощью формы слева."
              />
            </div>
          </div>
        </div>
      </TabsContent>

      {/* ── Ресурсы ── */}
      <TabsContent value="resources" className="mt-4">
        <div className="mb-4 flex gap-3 rounded-xl border border-border bg-muted/30 p-4">
          <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <div className="space-y-1 text-sm">
            <p className="font-medium text-foreground">Объекты для настройки доступа</p>
            <p className="text-muted-foreground">
              Здесь вы описываете, что есть в доме: комнаты, устройства и сценарии. Потом на вкладке
              «Политики» можно указать, кто и к чему имеет доступ.
            </p>
            <p className="text-xs text-muted-foreground">
              Пример структуры: <span className="text-foreground">Дом → Кухня → Лампа над столом</span>
            </p>
          </div>
        </div>

        <div className="grid min-h-[calc(100vh-16rem)] gap-4 lg:grid-cols-[minmax(300px,380px),1fr]">
          <div className="h-fit rounded-xl border border-border bg-card p-4">
            <h4 className="text-sm font-semibold text-foreground">Добавить объект</h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Заполните поля по порядку — система подскажет, куда можно поместить новый элемент.
            </p>
            <div className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="resource-name" className="text-sm font-medium text-foreground">
                  Название
                </label>
                <Input
                  id="resource-name"
                  placeholder="Например: Камера у входа"
                  value={resourceName}
                  onChange={(event) => setResourceName(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">Как объект будет отображаться в списке</p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="resource-type" className="text-sm font-medium text-foreground">
                  Что добавляем?
                </label>
                <Select
                  value={resourceType}
                  onValueChange={(value: CreatableResourceType) => {
                    setResourceType(value);
                  }}
                >
                  <SelectTrigger id="resource-type" className="w-full">
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOURCE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {RESOURCE_TYPE_LABELS[type] ?? type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{RESOURCE_TYPE_HINTS[resourceType]}</p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="resource-parent" className="text-sm font-medium text-foreground">
                  Куда поместить?
                </label>
                <Select
                  value={resourceParentId}
                  onValueChange={setResourceParentId}
                  disabled={validParentResources.length === 0}
                >
                  <SelectTrigger id="resource-parent" className="w-full">
                    <SelectValue
                      placeholder={
                        validParentResources.length === 0
                          ? 'Сначала нужен родительский объект'
                          : 'Выберите расположение'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {validParentResources.map((resource) => (
                      <SelectItem key={resource.id} value={resource.id}>
                        {resource.path}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {validParentResources.length === 0
                    ? 'Для выбранного типа пока нет подходящего места. Начните с комнаты.'
                    : PARENT_SELECTOR_HINTS[resourceType]}
                </p>
              </div>

              <AppButton
                className="w-full sm:w-auto"
                size="sm"
                onClick={handleCreateResource}
                disabled={!houseId || resourceCreating || !resourceParentId}
              >
                {resourceCreating ? 'Добавляем…' : 'Добавить в структуру'}
              </AppButton>
            </div>
          </div>

          <div className="flex min-h-[24rem] flex-col rounded-xl border border-border bg-card p-4 lg:min-h-0">
            <div className="shrink-0">
              <h4 className="text-sm font-semibold text-foreground">Структура дома</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                Все объекты, к которым можно настроить права доступа. Вложенность показывает, где что
                находится.
              </p>
            </div>
            <div className="mt-3 min-h-0 flex-1 overflow-auto rounded-lg border border-border bg-muted/20 pr-1">
              <ResourceTreeView
                nodes={resourcesTree}
                loading={resourcesLoading}
                emptyMessage="Структура пока пуста. Добавьте первую комнату или устройство с помощью формы слева."
              />
            </div>
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
