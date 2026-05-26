import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DoorOpen, Plus, Pencil, Trash2, Check, X, Loader2, ShieldOff } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/useI18n'
import {
  listLocalHouses,
  listLocalRooms,
  createLocalRoom,
  updateLocalRoom,
  deleteLocalRoom,
  type LocalRoom,
} from '@/api/local-access'
import { listPhysicalDevices } from '@/api/physical-devices'
import { useSettingsStore } from '@/stores/settings.store'

// ── Shared hook ───────────────────────────────────────────────────────────────

function useLocalHouse() {
  const userId = useSettingsStore((s) => s.userId)
  return useQuery({
    queryKey: ['local-houses', userId],
    queryFn: () => listLocalHouses(userId || undefined),
  })
}

// ── Room card with inline rename ──────────────────────────────────────────────

function RoomCard({
  room,
  onDelete,
}: {
  room: LocalRoom
  onDelete: (id: string) => void
}) {
  const { t } = useI18n()
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [nameDraft, setNameDraft] = useState(room.name)

  const { data: devicesPage } = useQuery({
    queryKey: ['physical-devices-count', room.id],
    queryFn: () => listPhysicalDevices({ roomId: room.id, size: 1 }),
  })
  const deviceCount = devicesPage?.totalElements ?? 0

  const updateMutation = useMutation({
    mutationFn: () => updateLocalRoom(room.id, nameDraft.trim()),
    onSuccess: () => {
      toast.success(t('rooms.toastUpdated'))
      setEditing(false)
      qc.invalidateQueries({ queryKey: ['local-rooms'] })
    },
    onError: () => toast.error(t('rooms.toastUpdateFailed')),
  })

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && nameDraft.trim()) updateMutation.mutate()
    if (e.key === 'Escape') {
      setNameDraft(room.name)
      setEditing(false)
    }
  }

  return (
    <div className="group relative rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
          <DoorOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>

        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex items-center gap-1.5">
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 rounded border border-blue-400 bg-white px-2 py-0.5 text-sm font-semibold text-slate-900 outline-none dark:bg-slate-900 dark:text-slate-100"
              />
              <button
                onClick={() => nameDraft.trim() && updateMutation.mutate()}
                disabled={!nameDraft.trim() || updateMutation.isPending}
                className="rounded p-1 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 dark:hover:bg-emerald-900/20"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                onClick={() => { setNameDraft(room.name); setEditing(false) }}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <p className="truncate font-semibold text-slate-900 dark:text-slate-100">{room.name}</p>
          )}

          <p className="mt-0.5 text-xs text-slate-400">
            {t('rooms.devicesInRoom', { count: String(deviceCount) })}
          </p>
        </div>
      </div>

      {/* Actions — visible on hover */}
      {!editing && (
        <div className="absolute right-2 top-2 hidden items-center gap-1 group-hover:flex">
          <button
            onClick={() => setEditing(true)}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            title={t('rooms.editRoom')}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(room.id)}
            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
            title={t('rooms.deleteRoom')}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

// ── Create room inline form ───────────────────────────────────────────────────

function CreateRoomForm({ houseId, onDone }: { houseId: string; onDone: () => void }) {
  const { t } = useI18n()
  const qc = useQueryClient()
  const [name, setName] = useState('')

  const mutation = useMutation({
    mutationFn: () => createLocalRoom(houseId, name.trim()),
    onSuccess: () => {
      toast.success(t('rooms.toastCreated'))
      qc.invalidateQueries({ queryKey: ['local-rooms', houseId] })
      onDone()
    },
    onError: () => toast.error(t('rooms.toastCreateFailed')),
  })

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-900/10">
      <div className="flex items-center gap-2">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && name.trim()) mutation.mutate()
            if (e.key === 'Escape') onDone()
          }}
          placeholder={t('rooms.namePlaceholder')}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        <button
          onClick={() => name.trim() && mutation.mutate()}
          disabled={!name.trim() || mutation.isPending}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {mutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          {mutation.isPending ? t('rooms.creating') : t('common.save')}
        </button>
        <button
          onClick={onDone}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          {t('common.cancel')}
        </button>
      </div>
    </div>
  )
}

// ── Delete confirm ────────────────────────────────────────────────────────────

function DeleteConfirm({
  room,
  onConfirm,
  onClose,
}: {
  room: LocalRoom
  onConfirm: () => void
  onClose: () => void
}) {
  const { t } = useI18n()
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        <p className="text-sm text-slate-700 dark:text-slate-300">
          {t('rooms.confirmDelete', { name: room.name })}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            {t('common.delete')}
          </button>
        </div>
      </div>
    </>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function RoomsPage() {
  const { t } = useI18n()
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<LocalRoom | null>(null)

  const { data: houses = [], isPending: housesPending } = useLocalHouse()
  const house = houses[0]

  const { data: rooms = [], isPending: roomsPending, isError } = useQuery({
    queryKey: ['local-rooms', house?.id],
    queryFn: () => listLocalRooms(house!.id),
    enabled: !!house,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteLocalRoom(id),
    onSuccess: () => {
      toast.success(t('rooms.toastDeleted'))
      qc.invalidateQueries({ queryKey: ['local-rooms', house?.id] })
    },
    onError: () => toast.error(t('rooms.toastDeleteFailed')),
  })

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
        <p className="font-medium text-slate-700 dark:text-slate-300">{t('rooms.noHouseTitle')}</p>
        <p className="mt-1 max-w-md text-sm text-slate-400">{t('rooms.noHouseHint')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {t('rooms.title')}
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">{house.name}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700',
            showCreate && 'opacity-50 pointer-events-none',
          )}
        >
          <Plus className="h-4 w-4" />
          {t('rooms.addRoom')}
        </button>
      </div>

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {t('rooms.loadError')}
        </div>
      )}

      {showCreate && (
        <CreateRoomForm houseId={house.id} onDone={() => setShowCreate(false)} />
      )}

      {roomsPending ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800"
            />
          ))}
        </div>
      ) : rooms.length === 0 && !showCreate ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <DoorOpen className="mb-4 h-10 w-10 text-slate-300" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">{t('rooms.emptyTitle')}</p>
          <p className="mt-1 max-w-md text-sm text-slate-400">{t('rooms.emptyHint')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onDelete={(id) => setDeleteTarget(rooms.find((r) => r.id === id) ?? null)}
            />
          ))}
        </div>
      )}

      {deleteTarget && (
        <DeleteConfirm
          room={deleteTarget}
          onConfirm={() => {
            deleteMutation.mutate(deleteTarget.id)
            setDeleteTarget(null)
          }}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
