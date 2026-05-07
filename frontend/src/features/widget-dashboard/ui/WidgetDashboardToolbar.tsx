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
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="flex items-center gap-2 min-w-0">
        <div
          className={`w-2 h-2 rounded-full flex-shrink-0 ${
            connected ? 'bg-green-500' : 'bg-slate-300'
          }`}
          title={connected ? 'Подключено' : 'Нет соединения'}
        />
        <span className="font-semibold text-sm text-foreground truncate">{dashboardName}</span>
      </div>

      <div className="flex-1" />

      {editMode && (
        <button
          onClick={onAddWidget}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
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

      <button
        onClick={onToggleEdit}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
          editMode
            ? 'border-border text-muted-foreground hover:bg-accent'
            : 'border-primary text-primary hover:bg-primary/10'
        }`}
      >
        {editMode ? 'Просмотр' : 'Редактировать'}
      </button>
    </div>
  );
}
