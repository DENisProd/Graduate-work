'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useScenarioPlannerStore, type ScenarioPlannerNode } from '@/store/scenario-planner-store';
import { useTranslation } from '@/hooks';

type CatalogItem = {
  type: ScenarioPlannerNode['type'];
  kind: ScenarioPlannerNode['kind'];
  titleRu: string;
  titleEn: string;
};

const triggers: CatalogItem[] = [
  { type: 'trigger', kind: 'MANUAL', titleRu: 'Вручную', titleEn: 'Manual' },
  { type: 'trigger', kind: 'SCHEDULE', titleRu: 'По расписанию', titleEn: 'Schedule' },
  { type: 'trigger', kind: 'DEVICE_EVENT', titleRu: 'Событие устройства', titleEn: 'Device event' },
  { type: 'trigger', kind: 'WEBHOOK', titleRu: 'Вебхук', titleEn: 'Webhook' },
];

const conditions: CatalogItem[] = [
  { type: 'condition', kind: 'ALWAYS', titleRu: 'Всегда', titleEn: 'Always' },
  { type: 'condition', kind: 'TIME_WINDOW', titleRu: 'Окно времени', titleEn: 'Time window' },
  { type: 'condition', kind: 'DEVICE_STATE', titleRu: 'Состояние устройства', titleEn: 'Device state' },
];

const actions: CatalogItem[] = [
  { type: 'action', kind: 'DEVICE_COMMAND', titleRu: 'Команда устройству', titleEn: 'Device command' },
  { type: 'action', kind: 'DELAY', titleRu: 'Пауза', titleEn: 'Delay' },
  { type: 'action', kind: 'NOTIFY', titleRu: 'Уведомление', titleEn: 'Notify' },
  { type: 'action', kind: 'HTTP_REQUEST', titleRu: 'HTTP-запрос', titleEn: 'HTTP request' },
];

export function CatalogPanel() {
  const { locale } = useTranslation();
  const addNode = useScenarioPlannerStore((s) => s.addNode);
  const setPendingCatalogItem = useScenarioPlannerStore((s) => s.setPendingCatalogItem);
  const nodes = useScenarioPlannerStore((s) => s.nodes);

  const nextY = (type: ScenarioPlannerNode['type']) => {
    const items = nodes.filter((n) => n.type === type);
    return 40 + items.length * 90;
  };

  const defaultX = (type: ScenarioPlannerNode['type']) => {
    if (type === 'trigger') return 320;
    if (type === 'condition') return 720;
    return 1120;
  };

  const sectionTitle = (t: 'triggers' | 'conditions' | 'actions') => {
    if (locale === 'ru') return t === 'triggers' ? 'Триггеры' : t === 'conditions' ? 'Условия' : 'Действия';
    return t === 'triggers' ? 'Triggers' : t === 'conditions' ? 'Conditions' : 'Actions';
  };

  const renderSection = (items: CatalogItem[], section: 'triggers' | 'conditions' | 'actions') => {
    const accent =
      section === 'triggers'
        ? 'border-l-blue-500'
        : section === 'conditions'
          ? 'border-l-purple-500'
          : 'border-l-emerald-500';

    return (
      <div className="space-y-2">
        <div className={`border-l-4 ${accent} pl-2 text-xs font-semibold text-muted-foreground`}>
          {sectionTitle(section)}
        </div>
        {items.map((item) => (
          <div
            key={`${item.type}-${item.kind}`}
            draggable
            onDragStart={(e) => {
              const title = locale === 'ru' ? item.titleRu : item.titleEn;
              setPendingCatalogItem({ type: item.type, kind: item.kind, title });
              e.dataTransfer.effectAllowed = 'copy';
              e.dataTransfer.setData('text/plain', `${item.type}:${item.kind}`);
            }}
            onDragEnd={() => setPendingCatalogItem(null)}
          >
            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={() =>
                addNode({
                  type: item.type,
                  kind: item.kind,
                  title: locale === 'ru' ? item.titleRu : item.titleEn,
                  x: defaultX(item.type),
                  y: nextY(item.type),
                  data: {},
                })
              }
            >
              <Plus className="mr-2 size-4" />
              {locale === 'ru' ? item.titleRu : item.titleEn}
            </Button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="h-full w-[300px] overflow-hidden flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{locale === 'ru' ? 'Блоки' : 'Blocks'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 flex-1 overflow-auto">
        {renderSection(triggers, 'triggers')}
        <div className="my-2 h-px bg-border" />
        {renderSection(conditions, 'conditions')}
        <div className="my-2 h-px bg-border" />
        {renderSection(actions, 'actions')}
        <p className="pt-2 text-xs text-muted-foreground">
          {locale === 'ru'
            ? 'Кликните блок слева, затем соединяйте: клик по блоку → клик по следующему.'
            : 'Click a block on the left, then connect: click a block → click the next one.'}
        </p>
      </CardContent>
    </Card>
  );
}

