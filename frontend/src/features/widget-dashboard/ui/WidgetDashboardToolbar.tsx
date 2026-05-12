'use client';

interface Props {
  editMode: boolean;
  connected: boolean;
  dashboardName: string;
  saving: boolean;
  onToggleEdit: () => void;
  onSave: () => void;
  onAddWidget: () => void;
}

export function WidgetDashboardToolbar({
  editMode,
  connected,
  dashboardName,
  saving,
  onToggleEdit,
  onSave,
  onAddWidget,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-3 min-w-0">


        <button
          onClick={onToggleEdit}
          className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
            editMode
              ? 'text-muted-foreground hover:bg-accent'
              : 'bg-primary/8 text-primary hover:bg-primary/16 dark:bg-primary/10 dark:hover:bg-primary/20'
          }`}
        >
          {editMode ? 'Просмотр' : 'Редактировать'}
        </button>
      </div>

      <div className="flex items-center gap-2">
        {editMode && (
          <button
            onClick={onAddWidget}
            className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20 dark:bg-primary/15 dark:hover:bg-primary/25"
          >
            <span className="text-base leading-none">+</span>
            Виджет
          </button>
        )}

        {editMode && (
          <button
            onClick={onSave}
            disabled={saving}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        )}
      </div>

    </div>
  );
}
