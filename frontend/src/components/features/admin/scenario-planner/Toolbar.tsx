'use client';

import { Button, ButtonGroup } from '@heroui/react';
import { Hand, Link2, MousePointer2, Target } from 'lucide-react';
import { useScenarioPlannerStore } from '@/store/scenario-planner-store';
import { useTranslation } from '@/hooks';

export function Toolbar() {
  const { locale } = useTranslation();
  const mode = useScenarioPlannerStore((s) => s.mode);
  const zoom = useScenarioPlannerStore((s) => s.zoom);
  const setMode = useScenarioPlannerStore((s) => s.setMode);
  const setZoom = useScenarioPlannerStore((s) => s.setZoom);
  const reset = useScenarioPlannerStore((s) => s.reset);
  const bumpGraphRevision = useScenarioPlannerStore((s) => s.bumpGraphRevision);

  return (
    <div className="flex items-center gap-2 p-4 border-b border-border bg-background">
      <ButtonGroup size="sm">
        <Button
          isIconOnly
          variant={mode === 'select' ? 'solid' : 'ghost'}
          onPress={() => setMode('select')}
          aria-label={locale === 'ru' ? 'Выбор' : 'Select'}
        >
          <MousePointer2 className="size-4" />
        </Button>
        <Button
          isIconOnly
          variant={mode === 'connect' ? 'solid' : 'ghost'}
          onPress={() => setMode('connect')}
          aria-label={locale === 'ru' ? 'Соединение' : 'Connect'}
        >
          <Link2 className="size-4" />
        </Button>
        <Button
          isIconOnly
          variant={mode === 'pan' ? 'solid' : 'ghost'}
          onPress={() => setMode('pan')}
          aria-label={locale === 'ru' ? 'Перемещение' : 'Pan'}
        >
          <Hand className="size-4" />
        </Button>
      </ButtonGroup>

      <div className="mx-2 h-6 w-px bg-border" />

      <ButtonGroup size="sm">
        <Button isIconOnly variant="ghost" onPress={() => setZoom(zoom - 10)} aria-label="Zoom out">
          −
        </Button>
        <span className="px-2 text-sm text-foreground">{zoom}%</span>
        <Button isIconOnly variant="ghost" onPress={() => setZoom(zoom + 10)} aria-label="Zoom in">
          +
        </Button>
      </ButtonGroup>

      <div className="flex-1" />

      <Button
        size="sm"
        variant="ghost"
        onPress={bumpGraphRevision}
      >
        <Target className="mr-2 size-4" />
        {locale === 'ru' ? 'В центр' : 'Fit'}
      </Button>

      <Button size="sm" variant="danger" onPress={reset}>
        {locale === 'ru' ? 'Очистить' : 'Reset'}
      </Button>
    </div>
  );
}

