import { useState, useRef, useEffect } from 'react'
import type { WidgetInstance } from '@/api/widget-dashboards'
import { WIDGET_META_MAP } from './widget-registry'

interface Props {
  widget: WidgetInstance
  editMode: boolean
  onEdit: (widget: WidgetInstance) => void
  onDelete: (id: string) => void
  onDuplicate: (widget: WidgetInstance) => void
  children: React.ReactNode
}

export function WidgetContainer({ widget, editMode, onEdit, onDelete, onDuplicate, children }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const meta = WIDGET_META_MAP[widget.type]

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  return (
    <div className="relative flex flex-col h-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
      {editMode && (
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50">
          <span className="truncate font-medium">
            {(widget.config.label as string | undefined) ?? meta?.label ?? widget.type}
          </span>
          <div className="relative flex-shrink-0 ml-2" ref={menuRef}>
            <button
              className="drag-handle cursor-grab active:cursor-grabbing p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 mr-1"
              title="Перетащить"
            >
              ⠿
            </button>
            <button
              onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
              title="Меню виджета"
            >
              ⋮
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg min-w-[140px] py-1">
                <button
                  onClick={() => { setMenuOpen(false); onEdit(widget) }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Настройки
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onDuplicate(widget) }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Дублировать
                </button>
                <div className="border-t border-slate-200 dark:border-slate-700 my-1" />
                <button
                  onClick={() => { setMenuOpen(false); onDelete(widget.id) }}
                  className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Удалить
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="flex-1 min-h-0 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
