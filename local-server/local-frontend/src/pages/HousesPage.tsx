import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Home, MapPin, Plus, Trash2, X, Loader2, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/useI18n'
import { listUserHouses, createHouse, deleteHouse } from '@/api/access'
import { HouseDetailPanel } from '@/components/shared/HouseDetailPanel'
import { useSettingsStore } from '@/stores/settings.store'
import type { House } from '@/types'

// ── Create house dialog ───────────────────────────────────────────────────────

function CreateHouseDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  const qc = useQueryClient()
  const userId = useSettingsStore((s) => s.userId)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')

  const mutation = useMutation({
    mutationFn: () => createHouse({ name: name.trim(), address: address.trim() || undefined }),
    onSuccess: () => {
      toast.success(t('houses.toastCreated'))
      qc.invalidateQueries({ queryKey: ['houses', userId] })
      onClose()
    },
    onError: () => toast.error(t('houses.toastCreateFailed')),
  })

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {t('houses.createTitle')}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              {t('houses.fieldName')}
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('houses.namePlaceholder')}
              onKeyDown={(e) => e.key === 'Enter' && name.trim() && mutation.mutate()}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              {t('houses.fieldAddress')}
            </label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t('houses.addressPlaceholder')}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-400"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!name.trim() || mutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {mutation.isPending ? t('houses.creating') : t('houses.createHouse')}
          </button>
        </div>
      </div>
    </>
  )
}

// ── Delete confirmation ───────────────────────────────────────────────────────

function DeleteConfirmDialog({
  house,
  onConfirm,
  onClose,
}: {
  house: House
  onConfirm: () => void
  onClose: () => void
}) {
  const { t } = useI18n()
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        <p className="text-sm text-slate-700 dark:text-slate-300">
          {t('houses.confirmDelete', { name: house.name })}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
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

export function HousesPage() {
  const { t } = useI18n()
  const qc = useQueryClient()
  const userId = useSettingsStore((s) => s.userId)
  const currentHouseId = useSettingsStore((s) => s.currentHouseId)
  const setCurrentHouse = useSettingsStore((s) => s.setCurrentHouse)
  const clearCurrentHouse = useSettingsStore((s) => s.clearCurrentHouse)

  const [selectedHouse, setSelectedHouse] = useState<House | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<House | null>(null)

  const { data: houses = [], isPending, isError } = useQuery({
    queryKey: ['houses', userId],
    queryFn: () => listUserHouses(userId),
    enabled: !!userId,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteHouse(id),
    onSuccess: (_, id) => {
      toast.success(t('houses.toastDeleted'))
      if (currentHouseId === id) clearCurrentHouse()
      if (selectedHouse?.id === id) setSelectedHouse(null)
      qc.invalidateQueries({ queryKey: ['houses', userId] })
    },
    onError: () => toast.error(t('houses.toastDeleteFailed')),
  })

  useEffect(() => {
    if (!currentHouseId || houses.length === 0) return
    if (!houses.some((h) => h.id === currentHouseId)) {
      clearCurrentHouse()
    }
  }, [houses, currentHouseId, clearCurrentHouse])

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <KeyRound className="mb-3 h-10 w-10 text-slate-400 dark:text-slate-600" />
        <p className="font-medium text-slate-700 dark:text-slate-300">{t('houses.noUserTitle')}</p>
        <p className="mt-1 text-sm text-slate-400">{t('houses.noUserHint')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{t('houses.title')}</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          {t('houses.createHouse')}
        </button>
      </div>

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {t('houses.loadError')}
        </div>
      )}

      {isPending ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800"
            />
          ))}
        </div>
      ) : houses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Home className="mb-4 h-12 w-12 text-slate-400 dark:text-slate-600" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">{t('houses.emptyTitle')}</p>
          <p className="mt-1 max-w-md text-sm text-slate-400">{t('houses.emptyHint')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {houses.map((house) => {
            const isOwner = house.ownerId === userId
            return (
              <div
                key={house.id}
                onClick={() => {
                  setSelectedHouse(house)
                  setCurrentHouse(house.id, house.name)
                }}
                className={cn(
                  'group relative cursor-pointer rounded-xl border bg-white p-4 transition-all hover:shadow-md dark:bg-slate-950',
                  selectedHouse?.id === house.id
                    ? 'border-blue-500 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800',
                )}
              >
                {isOwner && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteTarget(house)
                    }}
                    className="absolute right-2 top-2 hidden rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-500 group-hover:flex dark:text-slate-600 dark:hover:bg-red-900/20"
                    title={t('common.delete')}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}

                <div className="flex items-start gap-3">
                  {house.avatarUrl ? (
                    <img
                      src={house.avatarUrl}
                      alt={house.name}
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Home className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900 dark:text-slate-100">{house.name}</p>
                    <p className="text-xs text-slate-400">
                      {house.conflictStrategy.replace(/_/g, ' ')}
                    </p>
                    {isOwner && (
                      <span className="mt-1 inline-block rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                        {t('common.owner')}
                      </span>
                    )}
                  </div>
                </div>

                {house.address && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{house.address}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showCreate && <CreateHouseDialog onClose={() => setShowCreate(false)} />}

      {deleteTarget && (
        <DeleteConfirmDialog
          house={deleteTarget}
          onConfirm={() => {
            deleteMutation.mutate(deleteTarget.id)
            setDeleteTarget(null)
          }}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {selectedHouse && (
        <HouseDetailPanel
          house={selectedHouse}
          onClose={() => setSelectedHouse(null)}
        />
      )}
    </div>
  )
}
