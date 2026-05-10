import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, X, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  listDeviceTypes,
  listDeviceCategories,
  listDevices,
  listDeviceFunctions,
} from '@/api/devices'
import type { CatalogDevice, DeviceFunction } from '@/types'

const PAGE_SIZE = 20

type DetailTab = 'info' | 'functions' | 'actions'

function CategoryList({
  categories,
  selectedId,
  onSelect,
}: {
  categories: { id: number; name: string }[]
  selectedId: number | null
  onSelect: (id: number) => void
}) {
  return (
    <ul className="space-y-0.5">
      {categories.map((c) => (
        <li key={c.id}>
          <button
            onClick={() => onSelect(c.id)}
            className={cn(
              'w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
              selectedId === c.id
                ? 'bg-blue-50 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
            )}
          >
            {c.name}
          </button>
        </li>
      ))}
    </ul>
  )
}

function StatusDot({ status }: { status: CatalogDevice['status'] }) {
  return (
    <span
      className={cn(
        'inline-block h-2 w-2 rounded-full',
        status === 'ONLINE' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600',
      )}
      title={status}
    />
  )
}

function FunctionsTable({ functions }: { functions: DeviceFunction[] }) {
  if (functions.length === 0) {
    return <p className="text-sm text-slate-400">No functions defined.</p>
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <table className="w-full text-xs">
        <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
          <tr>
            {['Code', 'Type', 'Writable', 'Value', 'Range', 'Unit'].map((h) => (
              <th
                key={h}
                className="px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-400"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {functions.map((fn) => (
            <tr key={fn.id} className="bg-white dark:bg-slate-950">
              <td className="px-3 py-2 font-mono text-slate-700 dark:text-slate-300">{fn.code}</td>
              <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{fn.dataType}</td>
              <td className="px-3 py-2">
                {fn.writable ? (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <Pencil className="h-3 w-3" /> Yes
                  </span>
                ) : (
                  <span className="text-slate-400">Read-only</span>
                )}
              </td>
              <td className="px-3 py-2 font-mono text-slate-600 dark:text-slate-400">
                {fn.currentValue !== undefined ? JSON.stringify(fn.currentValue) : '—'}
              </td>
              <td className="px-3 py-2 text-slate-500 dark:text-slate-400">
                {fn.minValue !== undefined && fn.maxValue !== undefined
                  ? `${fn.minValue} – ${fn.maxValue}`
                  : '—'}
              </td>
              <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{fn.unit ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DeviceDrawer({
  device,
  onClose,
}: {
  device: CatalogDevice
  onClose: () => void
}) {
  const [detailTab, setDetailTab] = useState<DetailTab>('info')

  const { data: functions = [], isPending } = useQuery({
    queryKey: ['device-functions', device.id],
    queryFn: () => listDeviceFunctions(device.id),
  })

  const writableFunctions = functions.filter((f) => f.writable)

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 z-50 flex h-full w-[480px] flex-col bg-white shadow-2xl dark:bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <StatusDot status={device.status} />
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                {device.translations.en.name}
              </h2>
            </div>
            <p className="mt-0.5 font-mono text-xs text-slate-500 dark:text-slate-400">
              {device.code}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-0 border-b border-slate-200 dark:border-slate-800">
          {(['info', 'functions', 'actions'] as DetailTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setDetailTab(t)}
              className={cn(
                'px-5 py-2.5 text-sm font-medium capitalize transition-colors',
                detailTab === t
                  ? 'border-b-2 border-blue-600 text-blue-700 dark:text-blue-400'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
              )}
            >
              {t}
              {t === 'functions' && functions.length > 0 && (
                <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  {functions.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {detailTab === 'info' && (
            <dl className="space-y-3 text-sm">
              {[
                ['Status', device.status],
                ['Code', device.code],
                ['Serial Number', device.serialNumber ?? '—'],
                ['Firmware', device.firmwareVersion ?? '—'],
                ['Last Seen', device.lastSeenAt ?? '—'],
                ['Description', device.translations.en.description ?? '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-3">
                  <dt className="w-28 shrink-0 text-slate-500 dark:text-slate-400">{label}</dt>
                  <dd className="text-slate-800 dark:text-slate-200">{value}</dd>
                </div>
              ))}
            </dl>
          )}

          {detailTab === 'functions' && (
            isPending ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-8 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                ))}
              </div>
            ) : (
              <FunctionsTable functions={functions} />
            )
          )}

          {detailTab === 'actions' && (
            writableFunctions.length === 0 ? (
              <p className="text-sm text-slate-400">No writable functions available.</p>
            ) : (
              <ul className="space-y-2">
                {writableFunctions.map((fn) => (
                  <li
                    key={fn.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-800"
                  >
                    <div>
                      <p className="font-mono text-sm font-medium text-slate-800 dark:text-slate-200">
                        {fn.code}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {fn.dataType}
                        {fn.unit ? ` · ${fn.unit}` : ''}
                        {fn.minValue !== undefined ? ` · ${fn.minValue}–${fn.maxValue}` : ''}
                      </p>
                    </div>
                    <Pencil className="h-4 w-4 text-slate-400" />
                  </li>
                ))}
              </ul>
            )
          )}
        </div>
      </div>
    </>
  )
}

export function CatalogPage() {
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [selectedDevice, setSelectedDevice] = useState<CatalogDevice | null>(null)
  const [page, setPage] = useState(0)

  const { data: types = [], isPending: typesLoading } = useQuery({
    queryKey: ['device-types'],
    queryFn: listDeviceTypes,
  })

  const { data: allCategories = [] } = useQuery({
    queryKey: ['device-categories'],
    queryFn: listDeviceCategories,
  })

  const { data: devicesPage, isPending: devicesLoading } = useQuery({
    queryKey: ['catalog-devices', page],
    queryFn: () => listDevices({ page, size: PAGE_SIZE }),
    enabled: selectedCategoryId !== null,
    placeholderData: (prev) => prev,
  })

  const categories = allCategories.filter(
    (c) => selectedTypeId === null || c.deviceTypeId === selectedTypeId,
  )

  const devices = devicesPage?.content ?? []
  const totalPages = devicesPage?.totalPages ?? 0

  return (
    <div className="flex h-full flex-col gap-4">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Device Catalog</h1>

      <div className="grid flex-1 grid-cols-3 gap-4 overflow-hidden">
        {/* Column 1: Device Types */}
        <Column title="Device Types" count={types.length}>
          {typesLoading ? (
            <ColumnSkeleton />
          ) : types.length === 0 ? (
            <ColumnEmpty>No types</ColumnEmpty>
          ) : (
            <CategoryList
              categories={types.map((t) => ({ id: t.id, name: t.translations.en.name }))}
              selectedId={selectedTypeId}
              onSelect={(id) => {
                setSelectedTypeId((prev) => (prev === id ? null : id))
                setSelectedCategoryId(null)
                setPage(0)
              }}
            />
          )}
        </Column>

        {/* Column 2: Categories */}
        <Column
          title="Categories"
          count={categories.length}
          empty={selectedTypeId === null ? 'Select a type' : undefined}
        >
          {selectedTypeId === null ? (
            <ColumnEmpty>← Select a device type</ColumnEmpty>
          ) : categories.length === 0 ? (
            <ColumnEmpty>No categories</ColumnEmpty>
          ) : (
            <CategoryList
              categories={categories.map((c) => ({ id: c.id, name: c.translations.en.name }))}
              selectedId={selectedCategoryId}
              onSelect={(id) => {
                setSelectedCategoryId((prev) => (prev === id ? null : id))
                setPage(0)
              }}
            />
          )}
        </Column>

        {/* Column 3: Devices */}
        <Column title="Devices" count={devicesPage?.totalElements}>
          {selectedCategoryId === null ? (
            <ColumnEmpty>← Select a category</ColumnEmpty>
          ) : devicesLoading ? (
            <ColumnSkeleton />
          ) : devices.length === 0 ? (
            <ColumnEmpty>No devices</ColumnEmpty>
          ) : (
            <div className="space-y-1">
              {devices.map((device) => (
                <button
                  key={device.id}
                  onClick={() => setSelectedDevice(device)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors',
                    selectedDevice?.id === device.id
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                  )}
                >
                  <StatusDot status={device.status} />
                  <span className="flex-1 truncate">{device.translations.en.name}</span>
                  <span className="font-mono text-xs text-slate-400">{device.code}</span>
                </button>
              ))}

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="rounded border border-slate-300 p-1 text-slate-500 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-xs text-slate-400">
                    {page + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="rounded border border-slate-300 p-1 text-slate-500 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </Column>
      </div>

      {selectedDevice && (
        <DeviceDrawer device={selectedDevice} onClose={() => setSelectedDevice(null)} />
      )}
    </div>
  )
}

function Column({
  title,
  count,
  children,
}: {
  title: string
  count?: number
  empty?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {title}
        </h2>
        {count !== undefined && (
          <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-400">
            {count}
          </span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-2">{children}</div>
    </div>
  )
}

function ColumnSkeleton() {
  return (
    <div className="space-y-1.5 p-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-8 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
      ))}
    </div>
  )
}

function ColumnEmpty({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-xs text-slate-400">{children}</p>
    </div>
  )
}
