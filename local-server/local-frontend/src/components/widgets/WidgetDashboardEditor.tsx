import React, { useState, useCallback, useEffect, useRef } from 'react'
import { ResponsiveGridLayout, useContainerWidth } from 'react-grid-layout'
import type { Layout, ResponsiveLayouts } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { LocalWidgetDashboard, WidgetInstance, WidgetLayout } from '@/api/widget-dashboards'
import type { WidgetType } from '@/api/widget-dashboards'
import { updateWidgetDashboard } from '@/api/widget-dashboards'
import { listPhysicalDevices } from '@/api/physical-devices'
import { listScenarios } from '@/api/scenarios'
import { WidgetPicker } from './WidgetPicker'
import { WidgetConfigDrawer } from './WidgetConfigDrawer'
import { WidgetDashboardToolbar } from './WidgetDashboardToolbar'
import { WidgetContainer } from './WidgetContainer'
import { WIDGET_META_MAP, WIDGET_TEMPLATE_MAP } from './widget-registry'
import { WidgetRenderer } from './WidgetGrid'

function nanoid() {
  return Math.random().toString(36).slice(2, 10)
}

interface Props {
  dashboard: LocalWidgetDashboard
}

export function WidgetDashboardEditor({ dashboard }: Props) {
  const queryClient = useQueryClient()
  const [editMode, setEditMode] = useState(false)
  const [widgets, setWidgets] = useState<WidgetInstance[]>(dashboard.widgets ?? [])
  const [layouts, setLayouts] = useState<Record<string, WidgetLayout[]>>(
    (dashboard.layouts as Record<string, WidgetLayout[]>) ?? {},
  )
  const [pickerOpen, setPickerOpen] = useState(false)
  const [editingWidget, setEditingWidget] = useState<WidgetInstance | null>(null)
  const [saving, setSaving] = useState(false)
  const layoutDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { width: containerWidth, containerRef, mounted: widthMounted } = useContainerWidth()

  useEffect(() => {
    setWidgets(dashboard.widgets ?? [])
    setLayouts((dashboard.layouts as Record<string, WidgetLayout[]>) ?? {})
  }, [dashboard.id])

  const devicesQ = useQuery({
    queryKey: ['all-physical-devices'],
    queryFn: () => listPhysicalDevices({ size: 200 }).then(r => r.content),
    staleTime: 60_000,
    enabled: editMode,
  })

  const scenariosQ = useQuery({
    queryKey: ['all-scenarios'],
    queryFn: () => listScenarios({ size: 200 }),
    staleTime: 60_000,
    enabled: editMode,
  })

  function addWidget(typeOrTemplateId: string) {
    const id = nanoid()
    const template = WIDGET_TEMPLATE_MAP[typeOrTemplateId]

    let newWidget: WidgetInstance
    let size: { w: number; h: number }
    let minSize: { w: number; h: number }

    if (template) {
      newWidget = { id, type: template.type, config: { type: template.type, ...template.config } }
      size = template.defaultSize
      minSize = template.minSize
    } else {
      const meta = WIDGET_META_MAP[typeOrTemplateId as WidgetType]
      newWidget = { id, type: typeOrTemplateId as WidgetType, config: { type: typeOrTemplateId as WidgetType, ...meta.defaultConfig } }
      size = meta.defaultSize
      minSize = meta.minSize
    }

    const newLayout: WidgetLayout = { i: id, x: 0, y: Infinity, w: size.w, h: size.h, minW: minSize.w, minH: minSize.h }
    setWidgets(prev => [...prev, newWidget])
    setLayouts(prev => ({
      ...prev,
      lg: [...(prev.lg ?? []), { ...newLayout }],
      md: [...(prev.md ?? []), { ...newLayout }],
      sm: [...(prev.sm ?? []), { ...newLayout }],
    }))
    setEditingWidget(newWidget)
  }

  function deleteWidget(id: string) {
    setWidgets(prev => prev.filter(w => w.id !== id))
    setLayouts(prev => {
      const next: Record<string, WidgetLayout[]> = {}
      for (const key of Object.keys(prev)) {
        next[key] = (prev[key] ?? []).filter(l => l.i !== id)
      }
      return next
    })
  }

  function duplicateWidget(widget: WidgetInstance) {
    const id = nanoid()
    const meta = WIDGET_META_MAP[widget.type]
    const currentLayout = (layouts.lg ?? []).find(l => l.i === widget.id)
    const newWidget: WidgetInstance = { ...widget, id }
    const newLayout: WidgetLayout = {
      i: id,
      x: currentLayout?.x ?? 0,
      y: Infinity,
      w: currentLayout?.w ?? meta?.defaultSize.w ?? 4,
      h: currentLayout?.h ?? meta?.defaultSize.h ?? 3,
      minW: meta?.minSize.w,
      minH: meta?.minSize.h,
    }
    setWidgets(prev => [...prev, newWidget])
    setLayouts(prev => ({
      ...prev,
      lg: [...(prev.lg ?? []), newLayout],
      md: [...(prev.md ?? []), newLayout],
      sm: [...(prev.sm ?? []), newLayout],
    }))
  }

  function saveWidget(updated: WidgetInstance) {
    setWidgets(prev => prev.map(w => w.id === updated.id ? updated : w))
  }

  const handleLayoutChange = useCallback(
    (_currentLayout: Layout, allLayouts: Partial<Record<string, Layout>>) => {
      const converted = allLayouts as unknown as Record<string, WidgetLayout[]>
      setLayouts(converted)
      if (layoutDebounceRef.current) clearTimeout(layoutDebounceRef.current)
      layoutDebounceRef.current = setTimeout(async () => {
        try {
          await updateWidgetDashboard(dashboard.id, { layouts: converted as Record<string, unknown> })
        } catch {
          // silently fail — user can always save explicitly
        }
      }, 800)
    },
    [dashboard.id],
  )

  async function handleSave() {
    setSaving(true)
    try {
      await updateWidgetDashboard(dashboard.id, {
        widgets: widgets as unknown[],
        layouts: layouts as Record<string, unknown>,
      })
      setEditingWidget(null)
      setEditMode(false)
      toast.success('Сохранено')
      queryClient.invalidateQueries({ queryKey: ['widget-dashboards'] })
    } catch {
      toast.error('Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    return () => { if (layoutDebounceRef.current) clearTimeout(layoutDebounceRef.current) }
  }, [])

  const currentLayouts: ResponsiveLayouts =
    layouts && Object.keys(layouts).length > 0
      ? (layouts as unknown as ResponsiveLayouts)
      : { lg: [], md: [], sm: [] }

  return (
    <div className="flex flex-col">
      <WidgetDashboardToolbar
        editMode={editMode}
        dashboardName={dashboard.name}
        saving={saving}
        onToggleEdit={() => setEditMode(v => !v)}
        onSave={handleSave}
        onAddWidget={() => setPickerOpen(true)}
      />

      {widgets.length === 0 && !editMode && (
        <div className="flex flex-col items-center justify-center gap-3 text-center py-10">
          <p className="text-sm text-slate-500 dark:text-slate-400">Дашборд пуст.</p>
          <button
            onClick={() => setEditMode(true)}
            className="rounded-lg border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 text-sm text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30"
          >
            Перейти в режим редактирования
          </button>
        </div>
      )}

      {(widgets.length > 0 || editMode) && (
        <div ref={containerRef as React.RefObject<HTMLDivElement>} className={cn('mt-1', editMode && 'rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-2 bg-slate-50/50 dark:bg-slate-900/30')}>
          {widthMounted && (
            <ResponsiveGridLayout
              width={containerWidth}
              className="layout"
              layouts={currentLayouts}
              breakpoints={{ lg: 1200, md: 768, sm: 480 }}
              cols={{ lg: 24, md: 12, sm: 6 }}
              rowHeight={50}
              dragConfig={{ enabled: editMode, handle: '.drag-handle' }}
              resizeConfig={{ enabled: editMode, handles: ['se'] }}
              onLayoutChange={handleLayoutChange}
              margin={[8, 8]}
            >
              {widgets.map(widget => (
                <div key={widget.id}>
                  <WidgetContainer
                    widget={widget}
                    editMode={editMode}
                    onEdit={setEditingWidget}
                    onDelete={deleteWidget}
                    onDuplicate={duplicateWidget}
                  >
                    <WidgetRenderer widget={widget} framed={false} />
                  </WidgetContainer>
                </div>
              ))}
            </ResponsiveGridLayout>
          )}

          {editMode && widgets.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400 dark:text-slate-600">
              <span className="text-4xl">＋</span>
              <p className="text-sm">Нажмите «+ Виджет» чтобы добавить первый виджет</p>
            </div>
          )}
        </div>
      )}

      <WidgetPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={typeOrTemplateId => addWidget(typeOrTemplateId)}
      />

      <WidgetConfigDrawer
        widget={editingWidget}
        devices={devicesQ.data ?? []}
        scenarios={scenariosQ.data ?? []}
        onClose={() => setEditingWidget(null)}
        onSave={saveWidget}
      />
    </div>
  )
}
