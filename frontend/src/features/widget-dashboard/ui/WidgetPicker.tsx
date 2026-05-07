'use client';

import { WIDGET_REGISTRY } from '../lib/widget-registry';
import type { WidgetType } from '../types/widget.types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (type: WidgetType) => void;
}

const ICON_SVG: Record<string, React.ReactNode> = {
  Gauge: <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1M4.22 4.22l.707.707m12.02 12.02.708.708M3 12h1m16 0h1M4.927 19.073l.707-.707M18.364 5.636l.707-.707M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z" />,
  Wifi: <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z" />,
  MousePointerClick: <><path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59" /></>,
  ToggleRight: <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 6 0m-6 0H5.25m8.25 0a3 3 0 0 0 3-3m-3 3a3 3 0 1 1-6 0m6 0h2.25M12 11.25a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" />,
  Zap: <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />,
  Type: <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />,
};

export function WidgetPicker({ open, onClose, onSelect }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold">Добавить виджет</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">✕</button>
        </div>
        <div className="overflow-y-auto p-4 grid grid-cols-2 gap-3">
          {WIDGET_REGISTRY.map((meta) => (
            <button
              key={meta.type}
              onClick={() => { onSelect(meta.type); onClose(); }}
              className="flex items-start gap-3 p-3 rounded-xl border border-border hover:border-primary hover:bg-accent/50 transition-colors text-left"
            >
              <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 text-primary"
                >
                  {ICON_SVG[meta.icon]}
                </svg>
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm text-foreground">{meta.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{meta.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
