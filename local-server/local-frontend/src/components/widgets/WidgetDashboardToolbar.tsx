interface Props {
  editMode: boolean
  dashboardName: string
  saving: boolean
  onToggleEdit: () => void
  onSave: () => void
  onAddWidget: () => void
}

export function WidgetDashboardToolbar({ editMode, dashboardName, saving, onToggleEdit, onSave, onAddWidget }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-2">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{dashboardName}</span>
        <button
          onClick={onToggleEdit}
          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
            editMode
              ? 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              : 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30'
          }`}
        >
          {editMode ? 'Просмотр' : 'Редактировать'}
        </button>
      </div>

      {editMode && (
        <div className="flex items-center gap-2">
          <button
            onClick={onAddWidget}
            className="flex items-center gap-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-700"
          >
            <span className="text-sm leading-none">+</span>
            Виджет
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      )}
    </div>
  )
}
