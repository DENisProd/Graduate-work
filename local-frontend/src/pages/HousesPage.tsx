import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Home, MapPin, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { listUserHouses, createHouse, deleteHouse } from '@/api/access'
import { HouseDetailPanel } from '@/components/shared/HouseDetailPanel'
import { useSettingsStore } from '@/stores/settings.store'
import type { House } from '@/types'

function ConfirmDialog({
  name,
  onConfirm,
  onCancel,
}: {
  name: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="fixed left-1/2 top-1/2 z-50 w-80 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">Delete house?</h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          "<span className="font-medium text-slate-700 dark:text-slate-300">{name}</span>" and all
          its members and rooms will be permanently deleted.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </>
  )
}

function CreateHouseModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (h: House) => void
}) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () => createHouse({ name: name.trim(), address: address.trim() || undefined }),
    onSuccess: (house) => {
      toast.success('House created')
      onCreated(house)
    },
    onError: () => toast.error('Failed to create house'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required'); return }
    setError('')
    mutation.mutate()
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-96 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">New House</h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Home"
              autoFocus
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            {error && <p className="text-xs font-medium text-red-600">{error}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Address <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {mutation.isPending ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

export function HousesPage() {
  const userId = useSettingsStore((s) => s.userId)
  const qc = useQueryClient()

  const [selectedHouse, setSelectedHouse] = useState<House | null>(null)
  const [pendingDelete, setPendingDelete] = useState<House | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const { data: houses = [], isPending, isError } = useQuery({
    queryKey: ['houses', userId],
    queryFn: () => listUserHouses(userId),
    enabled: !!userId,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteHouse(id),
    onSuccess: () => {
      toast.success('House deleted')
      setPendingDelete(null)
      if (selectedHouse?.id === pendingDelete?.id) setSelectedHouse(null)
      qc.invalidateQueries({ queryKey: ['houses', userId] })
    },
    onError: () => toast.error('Failed to delete house'),
  })

  const handleCreated = (house: House) => {
    qc.invalidateQueries({ queryKey: ['houses', userId] })
    setShowCreate(false)
    setSelectedHouse(house)
  }

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-3 text-4xl">🔑</div>
        <p className="font-medium text-slate-700 dark:text-slate-300">No User ID configured</p>
        <p className="mt-1 text-sm text-slate-400">
          Set your User UUID in <strong>Settings → Identity</strong> first.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Houses</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> New House
        </button>
      </div>

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          Failed to load houses. Check that the local server is running.
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
          <div className="mb-4 text-5xl">🏠</div>
          <p className="font-semibold text-slate-700 dark:text-slate-300">No houses yet</p>
          <p className="mt-1 text-sm text-slate-400">Create your first smart home</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-5 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Create your first house
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {houses.map((house) => (
            <div
              key={house.id}
              onClick={() => setSelectedHouse(house)}
              className={cn(
                'group cursor-pointer rounded-xl border bg-white p-4 transition-all hover:shadow-md dark:bg-slate-950',
                selectedHouse?.id === house.id
                  ? 'border-blue-500 ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-800',
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {house.avatarUrl ? (
                    <img
                      src={house.avatarUrl}
                      alt={house.name}
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Home className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{house.name}</p>
                    <p className="text-xs text-slate-400">
                      {house.conflictStrategy.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>

                {userId === house.ownerId && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setPendingDelete(house) }}
                    className="rounded-lg p-1.5 text-slate-300 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:text-slate-600 dark:hover:bg-red-900/20"
                    title="Delete house"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {house.address && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{house.address}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedHouse && (
        <HouseDetailPanel
          house={selectedHouse}
          onClose={() => setSelectedHouse(null)}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          name={pendingDelete.name}
          onConfirm={() => deleteMutation.mutate(pendingDelete.id)}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      {showCreate && (
        <CreateHouseModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}
