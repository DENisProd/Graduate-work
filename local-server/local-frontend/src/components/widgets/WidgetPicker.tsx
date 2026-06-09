import { useState } from 'react'
import { WIDGET_REGISTRY, WIDGET_TEMPLATES } from './widget-registry'
import type { WidgetTemplate } from './widget-registry'
import type { WidgetType } from '@/api/widget-dashboards'

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (typeOrTemplateId: WidgetType | string) => void
}

const ICON_SVG: Record<string, React.ReactNode> = {
  Gauge: <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1M4.22 4.22l.707.707m12.02 12.02.708.708M3 12h1m16 0h1M4.927 19.073l.707-.707M18.364 5.636l.707-.707M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z" />,
  Wifi: <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z" />,
  MousePointerClick: <><path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59" /></>,
  ToggleRight: <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 6 0m-6 0H5.25m8.25 0a3 3 0 0 0 3-3m-3 3a3 3 0 1 1-6 0m6 0h2.25M12 11.25a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" />,
  Zap: <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />,
  Type: <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />,
  GaugeDial: <><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12a8.25 8.25 0 1 1 16.5 0" /><path strokeLinecap="round" strokeLinejoin="round" d="m12 12 4-3" /></>,
  CircleProgress: <><circle cx="12" cy="12" r="9" strokeWidth={1.5} /><path strokeLinecap="round" strokeLinejoin="round" d="M12 3a9 9 0 0 1 6.36 15.36" /></>,
  Sliders: <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h10.5M3 6h4.5m3 6h10.5M3 12h4.5m3 6h10.5M3 18h4.5M9 4.5v3M9 10.5v3M9 16.5v3M15 7.5v.001" />,
  CardHero: <><rect x="3" y="5" width="18" height="14" rx="3" strokeWidth={1.5} /><circle cx="8" cy="10" r="1.5" strokeWidth={1.5} /><path strokeLinecap="round" strokeLinejoin="round" d="M3 16l5-5 4 4 3-3 6 6" /></>,
  LineChart: <path strokeLinecap="round" strokeLinejoin="round" d="M3 17 9 11 13 15 21 7M21 7v4M21 7h-4" />,
}

const TEMPLATE_ACCENT: Record<WidgetTemplate['accent'], string> = {
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-400 dark:bg-emerald-900/25 dark:text-emerald-200 dark:border-emerald-700/60 dark:hover:border-emerald-500/80',
  blue: 'bg-sky-50 text-sky-700 border-sky-200 hover:border-sky-400 dark:bg-sky-900/25 dark:text-sky-200 dark:border-sky-700/60 dark:hover:border-sky-500/80',
  amber: 'bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-400 dark:bg-amber-900/25 dark:text-amber-200 dark:border-amber-700/60 dark:hover:border-amber-500/80',
  red: 'bg-rose-50 text-rose-700 border-rose-200 hover:border-rose-400 dark:bg-rose-900/25 dark:text-rose-200 dark:border-rose-700/60 dark:hover:border-rose-500/80',
  slate: 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-400 dark:bg-slate-800/40 dark:text-slate-200 dark:border-slate-700 dark:hover:border-slate-500',
}

function IconBox({ icon, className }: { icon: string; className?: string }) {
  return (
    <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${className ?? 'bg-blue-100 dark:bg-blue-900/30'}`}>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        {ICON_SVG[icon] ?? ICON_SVG.Gauge}
      </svg>
    </div>
  )
}

export function WidgetPicker({ open, onClose, onSelect }: Props) {
  const [tab, setTab] = useState<'templates' | 'widgets'>('templates')

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Добавить виджет</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xl">✕</button>
        </div>

        <div className="px-5 pt-3">
          <div className="inline-flex p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
            <button
              onClick={() => setTab('templates')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${tab === 'templates' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Шаблоны
            </button>
            <button
              onClick={() => setTab('widgets')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${tab === 'widgets' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Все виджеты
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {tab === 'templates'
              ? 'Готовые карточки в стиле умного дома — кликните, выберите устройство и сохраните.'
              : 'Базовые типы виджетов с минимальной конфигурацией.'}
          </p>
        </div>

        <div className="overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tab === 'templates'
            ? WIDGET_TEMPLATES.map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => { onSelect(tpl.id); onClose() }}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-colors text-left ${TEMPLATE_ACCENT[tpl.accent]}`}
                >
                  <IconBox icon={tpl.icon} className="bg-white/60 text-current dark:bg-slate-950/45" />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{tpl.label}</p>
                    <p className="text-xs opacity-80 mt-0.5 line-clamp-2">{tpl.description}</p>
                  </div>
                </button>
              ))
            : WIDGET_REGISTRY.map(meta => (
                <button
                  key={meta.type}
                  onClick={() => { onSelect(meta.type); onClose() }}
                  className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
                >
                  <IconBox icon={meta.icon} className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-slate-900 dark:text-slate-100">{meta.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{meta.description}</p>
                  </div>
                </button>
              ))}
        </div>
      </div>
    </div>
  )
}
