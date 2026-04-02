'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';
import { useScenarioPlannerStore } from '@/store/scenario-planner-store';
import { useTranslation } from '@/hooks';

export function PropertyPanel() {
  const { locale } = useTranslation();
  const nodes = useScenarioPlannerStore((s) => s.nodes);
  const edges = useScenarioPlannerStore((s) => s.edges);
  const selectedNodeId = useScenarioPlannerStore((s) => s.selectedNodeId);
  const updateNode = useScenarioPlannerStore((s) => s.updateNode);
  const removeNode = useScenarioPlannerStore((s) => s.removeNode);

  const node = nodes.find((n) => n.id === selectedNodeId) ?? null;
  const isSystem = node?.type === 'start' || node?.type === 'end';

  return (
    <Card className="h-full w-[300px] overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{locale === 'ru' ? 'Свойства' : 'Properties'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!node ? (
          <div className="text-sm text-muted-foreground">
            {locale === 'ru' ? 'Выберите блок на схеме.' : 'Select a block on the canvas.'}
          </div>
        ) : (
          <>
            <div className="text-xs text-muted-foreground">
              {locale === 'ru' ? 'Тип' : 'Type'}: <span className="font-medium text-foreground">{node.type}</span>
              {' · '}
              {locale === 'ru' ? 'Вид' : 'Kind'}: <span className="font-medium text-foreground">{node.kind}</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">{locale === 'ru' ? 'Название' : 'Title'}</label>
              <Input
                value={node.title}
                onChange={(e) => updateNode(node.id, { title: e.target.value })}
                disabled={isSystem}
              />
            </div>

            <div className="text-xs text-muted-foreground">
              {locale === 'ru' ? 'Связи' : 'Connections'}:{' '}
              <span className="font-medium text-foreground">
                {edges.filter((e) => e.from === node.id || e.to === node.id).length}
              </span>
            </div>

            <Button variant="destructive" onClick={() => removeNode(node.id)} disabled={isSystem}>
              <Trash2 className="mr-2 size-4" />
              {locale === 'ru' ? 'Удалить блок' : 'Remove block'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

