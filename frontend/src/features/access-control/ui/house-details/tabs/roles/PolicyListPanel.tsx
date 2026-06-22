'use client';

import { Ban, Check, Eye, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type {
  CreatePolicyRequestDto,
  HousePolicyResponse,
  HouseRoleResponse,
} from '@/types/api';

const EFFECT_LABELS: Record<CreatePolicyRequestDto['effect'], string> = {
  ALLOW: 'Разрешить',
  DENY: 'Запретить',
  READ: 'Только просмотр',
  WRITE: 'Только управление',
};

const EFFECT_BADGE_CLASS: Record<CreatePolicyRequestDto['effect'], string> = {
  ALLOW: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  DENY: 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200',
  READ: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200',
  WRITE: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200',
};

function getEffectIcon(effect: CreatePolicyRequestDto['effect']) {
  switch (effect) {
    case 'DENY':
      return Ban;
    case 'READ':
      return Eye;
    case 'WRITE':
      return Pencil;
    default:
      return Check;
  }
}

function resolveSubjectName(
  policy: HousePolicyResponse,
  roles: HouseRoleResponse[],
  houseMembers: Array<{ id: string; name?: string }>,
): string | undefined {
  if (policy.subjectType === 'ROLE' && policy.subjectId) {
    const role = roles.find((item) => item.id === policy.subjectId);
    return role ? (role.name ?? role.code) : policy.subjectId;
  }
  if ((policy.subjectType === 'MEMBER' || policy.subjectType === 'USER') && policy.subjectId) {
    const member = houseMembers.find((item) => item.id === policy.subjectId);
    return member?.name ?? policy.subjectId;
  }
  return undefined;
}

function buildPolicySummary(
  policy: HousePolicyResponse,
  roles: HouseRoleResponse[],
  houseMembers: Array<{ id: string; name?: string }>,
  resourcePath?: string,
  compactSubject = false,
): string {
  const target = resourcePath ? `«${resourcePath}»` : 'выбранному объекту';

  if (compactSubject) {
    switch (policy.effect) {
      case 'DENY':
        return `Запрещён доступ к ${target}`;
      case 'READ':
        return `Только просмотр ${target}`;
      case 'WRITE':
        return `Можно управлять ${target}, но не менять настройки`;
      default:
        return `Разрешён доступ к ${target}`;
    }
  }

  const subjectName = resolveSubjectName(policy, roles, houseMembers);

  let who: string;
  switch (policy.subjectType) {
    case 'ROLE':
      who = subjectName ? `Роль «${subjectName}»` : 'Выбранная роль';
      break;
    case 'MEMBER':
    case 'USER':
      who = subjectName ? `Участник «${subjectName}»` : 'Выбранный участник';
      break;
    default:
      who = 'Все пользователи';
  }

  switch (policy.effect) {
    case 'DENY':
      return `${who} не могут пользоваться ${target}`;
    case 'READ':
      return `${who} могут только смотреть ${target}`;
    case 'WRITE':
      return `${who} могут управлять ${target}, но не менять настройки`;
    default:
      return `${who} могут пользоваться ${target}`;
  }
}

interface PolicyListPanelProps {
  policies: HousePolicyResponse[];
  roles: HouseRoleResponse[];
  houseMembers: Array<{ id: string; name?: string }>;
  resourcesById: Map<string, { id: string; type: string; name?: string; path: string }>;
  loading?: boolean;
  emptyMessage?: string;
  embedded?: boolean;
  compactSubject?: boolean;
}

export function PolicyListPanel({
  policies,
  roles,
  houseMembers,
  resourcesById,
  loading,
  emptyMessage,
  embedded = false,
  compactSubject = false,
}: PolicyListPanelProps) {
  if (loading) {
    return (
      <div className={embedded ? 'space-y-2' : 'space-y-2 p-2'}>
        <Skeleton className={embedded ? 'h-12 w-full' : 'h-16 w-full'} />
        <Skeleton className={embedded ? 'h-12 w-full' : 'h-16 w-full'} />
      </div>
    );
  }

  if (policies.length === 0) {
    return (
      <div
        className={
          embedded
            ? 'py-2'
            : 'flex h-full min-h-[12rem] items-center justify-center p-4 text-center'
        }
      >
        <p className={embedded ? 'text-xs text-muted-foreground' : 'max-w-sm text-sm text-muted-foreground'}>
          {emptyMessage ?? 'Правил пока нет. Создайте первое правило с помощью формы слева.'}
        </p>
      </div>
    );
  }

  return (
    <div className={embedded ? 'space-y-2' : 'space-y-2 py-1'}>
      {policies.map((policy) => {
        const effect = (policy.effect ?? 'ALLOW') as CreatePolicyRequestDto['effect'];
        const EffectIcon = getEffectIcon(effect);
        const resourcePath = policy.resourceId
          ? resourcesById.get(policy.resourceId)?.path
          : undefined;
        const timeFrom = policy.condition?.timeFrom as string | undefined;
        const timeTo = policy.condition?.timeTo as string | undefined;

        return (
          <div
            key={policy.id}
            className="rounded-lg border border-border bg-background p-3 shadow-sm"
          >
            <div className="flex items-start gap-2">
              <div
                className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border ${EFFECT_BADGE_CLASS[effect]}`}
              >
                <EffectIcon className="size-3.5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {policy.name ?? 'Без названия'}
                  </span>
                  <Badge variant="outline" className={EFFECT_BADGE_CLASS[effect]}>
                    {EFFECT_LABELS[effect]}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {buildPolicySummary(policy, roles, houseMembers, resourcePath, compactSubject)}
                </p>
                {(timeFrom ?? timeTo) && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Действует: {timeFrom ?? '00:00'} — {timeTo ?? '23:59'}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
