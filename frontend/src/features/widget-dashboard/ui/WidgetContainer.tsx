'use client';

import { useState, useRef, useEffect } from 'react';
import type { WidgetInstance } from '../types/widget.types';
import { WIDGET_META_MAP } from '../lib/widget-registry';

interface Props {
  widget: WidgetInstance;
  editMode: boolean;
  onEdit: (widget: WidgetInstance) => void;
  onDelete: (id: string) => void;
  onDuplicate: (widget: WidgetInstance) => void;
  children: React.ReactNode;
}

export function WidgetContainer({ widget, editMode, onEdit, onDelete, onDuplicate, children }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const meta = WIDGET_META_MAP[widget.type];

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  return (
    <div className="widget-container relative flex flex-col h-full bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <div
        className={`widget-header flex items-center justify-between px-3 py-1.5 border-b border-border text-xs text-muted-foreground ${
          editMode ? 'bg-accent/30' : 'bg-transparent'
        }`}
      >
        <span className="truncate font-medium">
          {((widget.config as unknown as Record<string, unknown>).label as string | undefined) ?? meta?.label ?? widget.type}
        </span>
        {editMode && (
          <div className="relative flex-shrink-0 ml-2" ref={menuRef}>
            <button
              className="drag-handle cursor-grab active:cursor-grabbing p-1 rounded hover:bg-accent mr-1"
              title="Перетащить"
            >
              ⠿
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
              className="p-1 rounded hover:bg-accent"
              title="Меню виджета"
            >
              ⋮
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border rounded-lg shadow-lg min-w-[140px] py-1">
                <button
                  onClick={() => { setMenuOpen(false); onEdit(widget); }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                >
                  Настройки
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onDuplicate(widget); }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                >
                  Дублировать
                </button>
                <div className="border-t border-border my-1" />
                <button
                  onClick={() => { setMenuOpen(false); onDelete(widget.id); }}
                  className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-accent"
                >
                  Удалить
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
