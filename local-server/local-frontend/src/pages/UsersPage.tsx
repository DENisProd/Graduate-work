import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { UserPlus, Trash2, Loader2, X, ShieldCheck, ShieldOff, Plus, User } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/useI18n'
import {
  listLocalHouses,
  listLocalMembers,
  addLocalMember,
  removeLocalMember,
  listLocalRoles,
  createLocalRole,
  deleteLocalRole,
  listMemberRoles,
  assignLocalRole,
  unassignLocalRole,
  type LocalMember,
  type LocalRole,
} from '@/api/local-access'
import { useSettingsStore } from '@/stores/settings.store'

// ── Shared hook: resolve the single house ────────────────────────────────────

function useLocalHouse() {
  const userId = useSettingsStore((s) => s.userId)
  return useQuery({
    queryKey: ['local-houses', userId],
    queryFn: () => listLocalHouses(userId || undefined),
  })
}

// ── Role badge row for a member ───────────────────────────────────────────────

function MemberRoleBadges({
  member,
  allRoles,
}: {
  member: LocalMember
  allRoles: LocalRole[]
}) {
  const { t } = useI18n()
  const qc = useQueryClient()

  const { data: memberRoles = [] } = useQuery({
    queryKey: ['member-roles', member.id],
    queryFn: () => listMemberRoles(member.id),
  })

  const assignMutation = useMutation({
    mutationFn: (roleId: string) => assignLocalRole(member.id, roleId),
    onSuccess: () => {
      toast.success(t('users.toastAssigned'))
      qc.invalidateQueries({ queryKey: ['member-roles', member.id] })
    },
    onError: () => toast.error(t('users.toastAssignFailed')),
  })

  const unassignMutation = useMutation({
    mutationFn: (roleId: string) => unassignLocalRole(member.id, roleId),
    onSuccess: () => {
      toast.success(t('users.toastUnassigned'))
      qc.invalidateQueries({ queryKey: ['member-roles', member.id] })
    },
    onError: () => toast.error(t('users.toastUnassignFailed')),
  })

  const unassigned = allRoles.filter((r) => !memberRoles.some((mr) => mr.id === r.id))

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {memberRoles.map((role) => (
        <span
          key={role.id}
          className="group flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
        >
          {role.name}
          {role.isSystem && (
            <ShieldCheck className="h-3 w-3 text-violet-500" />
          )}
          <button
            onClick={() => unassignMutation.mutate(role.id)}
            className="hidden group-hover:inline text-blue-400 hover:text-red-500"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}

      {unassigned.length > 0 && (
        <select
          defaultValue=""
          onChange={(e) => {
            if (!e.target.value) return
            assignMutation.mutate(e.target.value)
            e.target.value = ''
          }}
          className="rounded-full border border-dashed border-slate-300 bg-transparent px-2 py-0.5 text-xs text-slate-500 outline-none dark:border-slate-700 dark:text-slate-400"
        >
          <option value="">{t('users.assignRole')}</option>
          {unassigned.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}

// ── Roles tab ─────────────────────────────────────────────────────────────────

function RolesTab({ houseId }: { houseId: string }) {
  const { t } = useI18n()
  const qc = useQueryClient()
  const [newName, setNewName] = useState('')

  const { data: roles = [], isPending } = useQuery({
    queryKey: ['local-roles', houseId],
    queryFn: () => listLocalRoles(houseId),
  })

  const createMutation = useMutation({
    mutationFn: () => createLocalRole(houseId, newName.trim()),
    onSuccess: () => {
      toast.success(t('users.toastRoleCreated'))
      setNewName('')
      qc.invalidateQueries({ queryKey: ['local-roles', houseId] })
    },
    onError: () => toast.error(t('users.toastRoleCreateFailed')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteLocalRole(id),
    onSuccess: () => {
      toast.success(t('users.toastRoleDeleted'))
      qc.invalidateQueries({ queryKey: ['local-roles', houseId] })
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && newName.trim() && createMutation.mutate()}
          placeholder={t('users.roleName')}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        <button
          onClick={() => createMutation.mutate()}
          disabled={!newName.trim() || createMutation.isPending}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {createMutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          {createMutation.isPending ? t('users.creatingRole') : t('users.addRole')}
        </button>
      </div>

      {isPending ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-9 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : roles.length === 0 ? (
        <p className="text-sm text-slate-400">{t('users.noRoles')}</p>
      ) : (
        <ul className="space-y-1.5">
          {roles.map((role) => (
            <li
              key={role.id}
              className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800"
            >
              <span className="flex-1 text-sm text-slate-800 dark:text-slate-200">{role.name}</span>
              {role.isSystem ? (
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                  system
                </span>
              ) : (
                <button
                  onClick={() => deleteMutation.mutate(role.id)}
                  className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Members tab ───────────────────────────────────────────────────────────────

function MembersTab({ houseId }: { houseId: string }) {
  const { t } = useI18n()
  const qc = useQueryClient()
  const [newId, setNewId] = useState('')
  const [confirmRemove, setConfirmRemove] = useState<LocalMember | null>(null)

  const { data: members = [], isPending } = useQuery({
    queryKey: ['local-members', houseId],
    queryFn: () => listLocalMembers(houseId),
  })

  const { data: allRoles = [] } = useQuery({
    queryKey: ['local-roles', houseId],
    queryFn: () => listLocalRoles(houseId),
  })

  const addMutation = useMutation({
    mutationFn: () => addLocalMember(houseId, newId.trim()),
    onSuccess: () => {
      toast.success(t('users.toastAdded'))
      setNewId('')
      qc.invalidateQueries({ queryKey: ['local-members', houseId] })
    },
    onError: () => toast.error(t('users.toastAddFailed')),
  })

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeLocalMember(houseId, id),
    onSuccess: () => {
      toast.success(t('users.toastRemoved'))
      qc.invalidateQueries({ queryKey: ['local-members', houseId] })
    },
    onError: () => toast.error(t('users.toastRemoveFailed')),
  })

  const displayId = (m: LocalMember) => m.externalUserId ?? m.userId

  return (
    <div className="space-y-4">
      {/* Add member */}
      <div className="flex gap-2">
        <input
          value={newId}
          onChange={(e) => setNewId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && newId.trim() && addMutation.mutate()}
          placeholder={t('users.addPlaceholder')}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        <button
          onClick={() => addMutation.mutate()}
          disabled={!newId.trim() || addMutation.isPending}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {addMutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <UserPlus className="h-3.5 w-3.5" />
          )}
          {addMutation.isPending ? t('users.adding') : t('users.addMember')}
        </button>
      </div>

      {/* List */}
      {isPending ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <User className="mb-3 h-10 w-10 text-slate-400 dark:text-slate-600" />
          <p className="font-medium text-slate-700 dark:text-slate-300">{t('users.emptyTitle')}</p>
          <p className="mt-1 text-sm text-slate-400">{t('users.emptyHint')}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {t('users.colUser')}
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {t('users.colJoined')}
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {t('users.colRoles')}
                </th>
                <th className="w-10 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {members.map((member) => (
                <tr
                  key={member.id}
                  className="bg-white hover:bg-slate-50/50 dark:bg-slate-950 dark:hover:bg-slate-900/50"
                >
                  <td className="px-4 py-3">
                    <span className="block truncate max-w-[200px] font-mono text-xs text-slate-700 dark:text-slate-300">
                      {displayId(member)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {format(parseISO(member.joinedAt), 'dd MMM yyyy')}
                  </td>
                  <td className="px-4 py-3">
                    <MemberRoleBadges member={member} allRoles={allRoles} />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setConfirmRemove(member)}
                      className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                      title={t('users.removeMember')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Remove confirm */}
      {confirmRemove && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setConfirmRemove(null)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              {t('users.confirmRemove', { id: displayId(confirmRemove).slice(0, 16) + '…' })}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setConfirmRemove(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => {
                  removeMutation.mutate(confirmRemove.id)
                  setConfirmRemove(null)
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

type Tab = 'members' | 'roles'

export function UsersPage() {
  const { t } = useI18n()
  const [tab, setTab] = useState<Tab>('members')

  const { data: houses = [], isPending: housesPending } = useLocalHouse()
  const house = houses[0]

  if (housesPending) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!house) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ShieldOff className="mb-4 h-10 w-10 text-slate-300" />
        <p className="font-medium text-slate-700 dark:text-slate-300">{t('users.noHouseTitle')}</p>
        <p className="mt-1 max-w-md text-sm text-slate-400">{t('users.noHouseHint')}</p>
      </div>
    )
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'members', label: t('users.tabMembers') },
    { key: 'roles', label: t('users.tabRoles') },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {t('users.title')}
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">{house.name}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        {TABS.map(({ key, label }) => (
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
            {label}
          </button>
        ))}
      </div>

      {tab === 'members' && <MembersTab houseId={house.id} />}
      {tab === 'roles' && <RolesTab houseId={house.id} />}
    </div>
  )
}
