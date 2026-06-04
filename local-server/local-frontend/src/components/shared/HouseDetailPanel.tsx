import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { X, UserPlus, Trash2, Copy, Check, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/useI18n'
import {
  listHouseMembers,
  addHouseMember,
  removeHouseMember,
  listHouseRoles,
  createHouseRole,
  assignRole,
  removeRole,
  listInvitations,
  createInvitation,
  revokeInvitation,
} from '@/api/access'
import { useSettingsStore } from '@/stores/settings.store'
import type { House, HouseMember, HouseInvitation } from '@/types'

type DetailTab = 'members' | 'roles' | 'invitations'

// ── Members tab ───────────────────────────────────────────────────────────────

function MembersTab({ house, isOwner }: { house: House; isOwner: boolean }) {
  const { t } = useI18n()
  const qc = useQueryClient()
  const [newUserId, setNewUserId] = useState('')

  const { data: members = [], isPending } = useQuery({
    queryKey: ['house-members', house.id],
    queryFn: () => listHouseMembers(house.id),
  })

  const { data: roles = [] } = useQuery({
    queryKey: ['house-roles', house.id],
    queryFn: () => listHouseRoles(house.id),
  })

  const addMutation = useMutation({
    mutationFn: () => addHouseMember(house.id, newUserId.trim()),
    onSuccess: () => {
      toast.success(t('housePanel.toastMemberAdded'))
      setNewUserId('')
      qc.invalidateQueries({ queryKey: ['house-members', house.id] })
    },
    onError: () => toast.error(t('housePanel.toastMemberAddFailed')),
  })

  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeHouseMember(house.id, userId),
    onSuccess: () => {
      toast.success(t('housePanel.toastMemberRemoved'))
      qc.invalidateQueries({ queryKey: ['house-members', house.id] })
    },
    onError: () => toast.error(t('housePanel.toastMemberRemoveFailed')),
  })

  const assignMutation = useMutation({
    mutationFn: ({ memberId, roleId }: { memberId: string; roleId: string }) =>
      assignRole(memberId, roleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['house-members', house.id] }),
    onError: () => toast.error(t('housePanel.toastAssignFailed')),
  })

  const unassignMutation = useMutation({
    mutationFn: ({ memberId, roleId }: { memberId: string; roleId: string }) =>
      removeRole(memberId, roleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['house-members', house.id] }),
    onError: () => toast.error(t('housePanel.toastUnassignFailed')),
  })

  const unassignedRoles = (member: HouseMember) =>
    roles.filter((r) => !member.roles.some((mr) => mr.id === r.id))

  return (
    <div className="space-y-4">
      {isOwner && (
        <div className="flex gap-2">
          <input
            value={newUserId}
            onChange={(e) => setNewUserId(e.target.value)}
            placeholder={t('housePanel.userUuid')}
            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <button
            onClick={() => addMutation.mutate()}
            disabled={!newUserId.trim() || addMutation.isPending}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <UserPlus className="h-3.5 w-3.5" /> {t('housePanel.addMember')}
          </button>
        </div>
      )}

      {isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <p className="text-sm text-slate-400">{t('housePanel.noMembers')}</p>
      ) : (
        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="rounded-lg border border-slate-200 p-3 dark:border-slate-800"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-xs text-slate-700 dark:text-slate-300">
                    {member.userId}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {t('housePanel.joined', { date: format(parseISO(member.joinedAt), 'dd MMM yyyy') })}
                  </p>
                </div>
                {isOwner && (
                  <button
                    onClick={() => removeMutation.mutate(member.userId)}
                    className="shrink-0 rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                    title={t('housePanel.removeMember')}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Role pills */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {member.roles.map((role) => (
                  <span
                    key={role.id}
                    className="group flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  >
                    {role.name}
                    {role.isOwner && (
                      <span className="rounded-full bg-violet-200 px-1 text-violet-700 dark:bg-violet-800 dark:text-violet-300">
                        {t('common.owner')}
                      </span>
                    )}
                    {isOwner && (
                      <button
                        onClick={() => unassignMutation.mutate({ memberId: member.id, roleId: role.id })}
                        className="hidden group-hover:inline text-blue-500 hover:text-red-500"
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}

                {isOwner && unassignedRoles(member).length > 0 && (
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      if (!e.target.value) return
                      assignMutation.mutate({ memberId: member.id, roleId: e.target.value })
                      e.target.value = ''
                    }}
                    className="rounded-full border border-dashed border-slate-300 bg-transparent px-2 py-0.5 text-xs text-slate-500 outline-none dark:border-slate-700 dark:text-slate-400"
                  >
                    <option value="">{t('housePanel.addRole')}</option>
                    {unassignedRoles(member).map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Roles tab ─────────────────────────────────────────────────────────────────

function RolesTab({ house, isOwner }: { house: House; isOwner: boolean }) {
  const { t } = useI18n()
  const qc = useQueryClient()
  const [newRoleName, setNewRoleName] = useState('')

  const { data: roles = [], isPending } = useQuery({
    queryKey: ['house-roles', house.id],
    queryFn: () => listHouseRoles(house.id),
  })

  const createMutation = useMutation({
    mutationFn: () => createHouseRole(house.id, newRoleName.trim()),
    onSuccess: () => {
      toast.success(t('housePanel.toastRoleCreated'))
      setNewRoleName('')
      qc.invalidateQueries({ queryKey: ['house-roles', house.id] })
    },
    onError: () => toast.error(t('housePanel.toastRoleCreateFailed')),
  })

  return (
    <div className="space-y-4">
      {isOwner && (
        <div className="flex gap-2">
          <input
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            placeholder={t('housePanel.roleName')}
            onKeyDown={(e) => e.key === 'Enter' && newRoleName.trim() && createMutation.mutate()}
            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <button
            onClick={() => createMutation.mutate()}
            disabled={!newRoleName.trim() || createMutation.isPending}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {t('housePanel.createRole')}
          </button>
        </div>
      )}

      {isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      ) : roles.length === 0 ? (
        <p className="text-sm text-slate-400">{t('housePanel.noRoles')}</p>
      ) : (
        <ul className="space-y-1.5">
          {roles.map((role) => (
            <li
              key={role.id}
              className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800"
            >
              <span className="flex-1 text-sm text-slate-800 dark:text-slate-200">{role.name}</span>
              {role.isOwner && (
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                  {t('common.owner')}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Invitations tab ───────────────────────────────────────────────────────────

function InvitationsTab({ house, isOwner }: { house: House; isOwner: boolean }) {
  const { t } = useI18n()
  const qc = useQueryClient()
  const [newInvitation, setNewInvitation] = useState<HouseInvitation | null>(null)
  const [copied, setCopied] = useState(false)

  const { data: invitations = [], isPending } = useQuery({
    queryKey: ['house-invitations', house.id],
    queryFn: () => listInvitations(house.id),
  })

  const createMutation = useMutation({
    mutationFn: () => createInvitation(house.id),
    onSuccess: (inv) => {
      setNewInvitation(inv)
      qc.invalidateQueries({ queryKey: ['house-invitations', house.id] })
    },
    onError: () => toast.error(t('housePanel.toastInviteFailed')),
  })

  const revokeMutation = useMutation({
    mutationFn: (id: string) => revokeInvitation(id),
    onSuccess: () => {
      toast.success(t('housePanel.toastRevoked'))
      qc.invalidateQueries({ queryKey: ['house-invitations', house.id] })
    },
    onError: () => toast.error(t('housePanel.toastRevokeFailed')),
  })

  const handleCopy = (token: string) => {
    navigator.clipboard.writeText(token).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2_000)
    })
  }

  return (
    <div className="space-y-4">
      {isOwner && (
        <button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {createMutation.isPending ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <UserPlus className="h-3.5 w-3.5" />
          )}
          {t('housePanel.createInvitation')}
        </button>
      )}

      {/* Show newly created token prominently */}
      {newInvitation && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-900/20">
          <p className="mb-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            {t('housePanel.tokenShare')}
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 break-all rounded bg-white px-2 py-1.5 font-mono text-xs text-slate-800 dark:bg-slate-900 dark:text-slate-200">
              {newInvitation.token}
            </code>
            <button
              onClick={() => handleCopy(newInvitation.token)}
              className="shrink-0 rounded-lg border border-emerald-300 p-1.5 text-emerald-600 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-400"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}

      {isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      ) : invitations.length === 0 ? (
        <p className="text-sm text-slate-400">{t('housePanel.noInvitations')}</p>
      ) : (
        <div className="space-y-2">
          {invitations.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800"
            >
              <div className="min-w-0 flex-1">
                <code className="block truncate font-mono text-xs text-slate-600 dark:text-slate-400">
                  {inv.token}
                </code>
                <p className="mt-0.5 text-xs text-slate-400">
                  {t('housePanel.created', { date: format(parseISO(inv.createdAt), 'dd MMM yyyy') })}
                  {inv.expiresAt &&
                    ` · ${t('housePanel.expires', { date: format(parseISO(inv.expiresAt), 'dd MMM yyyy') })}`}
                </p>
              </div>
              <button
                onClick={() => handleCopy(inv.token)}
                className="shrink-0 rounded p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                title={t('housePanel.copyToken')}
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              {isOwner && (
                <button
                  onClick={() => revokeMutation.mutate(inv.id)}
                  className="shrink-0 rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                  title={t('housePanel.revoke')}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────

interface Props {
  house: House
  onClose: () => void
}

export function HouseDetailPanel({ house, onClose }: Props) {
  const { t } = useI18n()
  const [tab, setTab] = useState<DetailTab>('members')
  const userId = useSettingsStore((s) => s.userId)
  const isOwner = userId === house.ownerId

  const TABS: { key: DetailTab; labelKey: 'housePanel.members' | 'housePanel.roles' | 'housePanel.invitations' }[] = [
    { key: 'members', labelKey: 'housePanel.members' },
    { key: 'roles', labelKey: 'housePanel.roles' },
    { key: 'invitations', labelKey: 'housePanel.invitations' },
  ]

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 flex h-full w-full flex-col bg-white shadow-2xl dark:bg-slate-950 sm:w-[480px]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">{house.name}</h2>
            {house.address && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{house.address}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          {TABS.map(({ key, labelKey }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium transition-colors',
                tab === key
                  ? 'border-b-2 border-blue-600 text-blue-700 dark:text-blue-400'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
              )}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {tab === 'members' && <MembersTab house={house} isOwner={isOwner} />}
          {tab === 'roles' && <RolesTab house={house} isOwner={isOwner} />}
          {tab === 'invitations' && <InvitationsTab house={house} isOwner={isOwner} />}
        </div>
      </div>
    </>
  )
}
