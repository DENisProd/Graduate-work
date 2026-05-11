import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Home, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/useI18n'
import { listUserHouses } from '@/api/access'
import { HouseDetailPanel } from '@/components/shared/HouseDetailPanel'
import { useSettingsStore } from '@/stores/settings.store'
import type { House } from '@/types'

export function HousesPage() {
  const { t } = useI18n()
  const userId = useSettingsStore((s) => s.userId)
  const currentHouseId = useSettingsStore((s) => s.currentHouseId)
  const setCurrentHouse = useSettingsStore((s) => s.setCurrentHouse)
  const clearCurrentHouse = useSettingsStore((s) => s.clearCurrentHouse)

  const [selectedHouse, setSelectedHouse] = useState<House | null>(null)

  const { data: houses = [], isPending, isError } = useQuery({
    queryKey: ['houses', userId],
    queryFn: () => listUserHouses(userId),
    enabled: !!userId,
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
        <div className="mb-3 text-4xl">🔑</div>
        <p className="font-medium text-slate-700 dark:text-slate-300">{t('houses.noUserTitle')}</p>
        <p className="mt-1 text-sm text-slate-400">{t('houses.noUserHint')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{t('houses.title')}</h1>
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
          <div className="mb-4 text-5xl">🏠</div>
          <p className="font-semibold text-slate-700 dark:text-slate-300">{t('houses.emptyTitle')}</p>
          <p className="mt-1 max-w-md text-sm text-slate-400">{t('houses.emptyHint')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {houses.map((house) => (
            <div
              key={house.id}
              onClick={() => {
                setSelectedHouse(house)
                setCurrentHouse(house.id, house.name)
              }}
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
    </div>
  )
}
