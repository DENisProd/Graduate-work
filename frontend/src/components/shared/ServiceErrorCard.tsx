'use client';

import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function sanitizeDetails(lines: string[]): string[] {
  return lines
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !l.includes('NEXT_PUBLIC_USE_MOCKS'))
    .slice(0, 8);
}

export function ServiceErrorCard({
  title,
  description,
  details,
  onRetry,
  className,
}: {
  title: string;
  description?: string;
  details?: string[];
  onRetry?: () => void;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const safeDetails = useMemo(() => (details?.length ? sanitizeDetails(details) : []), [details]);

  return (
    <Card className={cn('border border-border bg-card shadow-sm', className)}>
      <Card.Content className="space-y-4 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <div
              className={cn(
                'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                'bg-destructive/10 text-destructive'
              )}
              aria-hidden
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 9v4m0 4h.01M10.3 3.6l-8 14A2 2 0 0 0 4 20h16a2 2 0 0 0 1.7-2.9l-8-14a2 2 0 0 0-3.4 0Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="min-w-0">
              <p className="text-base font-semibold text-foreground">{title}</p>
              {description ? (
                <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {safeDetails.length ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
              >
                {expanded ? 'Скрыть детали' : 'Подробнее'}
              </Button>
            ) : null}
            {onRetry ? (
              <Button size="sm" onClick={onRetry}>
                Повторить
              </Button>
            ) : null}
          </div>
        </div>

        {expanded && safeDetails.length ? (
          <div className="rounded-xl border border-border bg-background/50 p-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Технические детали
            </p>
            <pre className="whitespace-pre-wrap break-words text-xs text-muted-foreground">
              {safeDetails.join('\n')}
            </pre>
          </div>
        ) : null}
      </Card.Content>
    </Card>
  );
}

