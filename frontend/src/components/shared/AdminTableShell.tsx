'use client';

import type { ReactNode } from 'react';

interface Props {
  title?: ReactNode;
  subtitle?: ReactNode;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  children: ReactNode;
}

export function AdminTableShell({ title, subtitle, leftSlot, rightSlot, children }: Props) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
      {(title || subtitle || leftSlot || rightSlot) && (
        <div className="flex flex-col gap-3 border-b border-border/60 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            {title && (
              <div className="truncate text-sm font-semibold text-foreground">{title}</div>
            )}
            {subtitle && (
              <div className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</div>
            )}
          </div>

          <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center md:justify-end">
            {leftSlot && <div className="md:mr-2">{leftSlot}</div>}
            {rightSlot && <div className="flex items-center gap-2">{rightSlot}</div>}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

