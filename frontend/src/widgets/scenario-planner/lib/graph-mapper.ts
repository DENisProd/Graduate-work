import type { ScenarioDefinitionV1, ScenarioTriggerV1, ScenarioActionV1, ScenarioConditionV1 } from '@/features/access-control/model/scenario-definition-v1';
import type { ScenarioPlannerEdge, ScenarioPlannerNode } from '@/store/scenario-planner-store';

export function definitionToGraph(def: ScenarioDefinitionV1, opts: { houseId: string; locale: string }) {
  const isRu = opts.locale === 'ru';
  const nodes: ScenarioPlannerNode[] = [
    {
      id: `start_${opts.houseId}`,
      type: 'start',
      kind: 'START',
      title: isRu ? 'Начало' : 'Start',
      x: 120,
      y: 120,
      data: {},
    },
    {
      id: `end_${opts.houseId}`,
      type: 'end',
      kind: 'END',
      title: isRu ? 'Конец' : 'End',
      x: 1520,
      y: 120,
      data: {},
    },
  ];

  const edges: ScenarioPlannerEdge[] = [];
  const startId = `start_${opts.houseId}`;
  const endId = `end_${opts.houseId}`;

  const triggerNodes: ScenarioPlannerNode[] = (def.triggers ?? []).map((t, idx) => ({
    id: `trigger_${idx}`,
    type: 'trigger',
    kind: t.type,
    title: triggerTitle(t, isRu),
    x: 320,
    y: 120 + idx * 90,
    data: t as any,
  }));

  const conditionNodes: ScenarioPlannerNode[] =
    def.conditions && def.conditions.type !== 'ALWAYS'
      ? [
          {
            id: `condition_0`,
            type: 'condition',
            kind: def.conditions.type as any,
            title: conditionTitle(def.conditions, isRu),
            x: 720,
            y: 120,
            data: def.conditions as any,
          },
        ]
      : [];

  const actionNodes: ScenarioPlannerNode[] = (def.actions ?? []).map((a, idx) => ({
    id: `action_${idx}`,
    type: 'action',
    kind: a.type,
    title: actionTitle(a, isRu),
    x: 1120,
    y: 120 + idx * 90,
    data: a as any,
  }));

  nodes.push(...triggerNodes, ...conditionNodes, ...actionNodes);

  // Start -> triggers or condition (if no triggers)
  if (triggerNodes.length > 0) {
    triggerNodes.forEach((t) => edges.push({ id: `e_${startId}_${t.id}`, from: startId, to: t.id }));
  } else if (conditionNodes[0]) {
    edges.push({ id: `e_${startId}_${conditionNodes[0].id}`, from: startId, to: conditionNodes[0].id });
  }

  // Triggers -> condition (if any) else -> actions
  triggerNodes.forEach((t) => {
    if (conditionNodes[0]) {
      edges.push({ id: `e_${t.id}_${conditionNodes[0].id}`, from: t.id, to: conditionNodes[0].id });
    } else {
      actionNodes.forEach((a) => edges.push({ id: `e_${t.id}_${a.id}`, from: t.id, to: a.id }));
    }
  });

  // Condition -> actions
  if (conditionNodes[0]) {
    actionNodes.forEach((a) =>
      edges.push({ id: `e_${conditionNodes[0].id}_${a.id}`, from: conditionNodes[0].id, to: a.id })
    );
  }

  // Actions -> end
  actionNodes.forEach((a) => edges.push({ id: `e_${a.id}_${endId}`, from: a.id, to: endId }));

  return { nodes, edges };
}

export function graphToDefinition(params: {
  nodes: ScenarioPlannerNode[];
  edges: ScenarioPlannerEdge[];
  base: ScenarioDefinitionV1;
}): ScenarioDefinitionV1 {
  // Keep scope/options from base; only rebuild triggers/conditions/actions from graph.
  const triggerNodes = params.nodes.filter((n) => n.type === 'trigger');
  const conditionNodes = params.nodes.filter((n) => n.type === 'condition');
  const actionNodes = params.nodes.filter((n) => n.type === 'action');

  // Order: left-to-right then top-to-bottom
  const byPos = (a: ScenarioPlannerNode, b: ScenarioPlannerNode) => (a.x - b.x) || (a.y - b.y);
  triggerNodes.sort(byPos);
  conditionNodes.sort(byPos);
  actionNodes.sort(byPos);

  const triggers: ScenarioTriggerV1[] = triggerNodes.map((n) => nodeToTrigger(n));
  const actions: ScenarioActionV1[] = actionNodes.map((n) => nodeToAction(n));

  let conditions: ScenarioConditionV1 | undefined;
  if (conditionNodes.length === 0) {
    conditions = undefined; // UI expects default ALWAYS behavior
  } else if (conditionNodes.length === 1) {
    conditions = nodeToCondition(conditionNodes[0]);
  } else {
    conditions = { type: 'AND', items: conditionNodes.map((n) => nodeToCondition(n)) };
  }

  return {
    ...params.base,
    triggers,
    actions,
    conditions,
  };
}

function triggerTitle(t: ScenarioTriggerV1, isRu: boolean) {
  switch (t.type) {
    case 'MANUAL':
      return isRu ? 'Вручную' : 'Manual';
    case 'SCHEDULE':
      return isRu ? 'По расписанию' : 'Schedule';
    case 'DEVICE_EVENT':
      return isRu ? 'Событие устройства' : 'Device event';
    case 'WEBHOOK':
      return isRu ? 'Вебхук' : 'Webhook';
  }
}

function actionTitle(a: ScenarioActionV1, isRu: boolean) {
  switch (a.type) {
    case 'DELAY':
      return isRu ? 'Пауза' : 'Delay';
    case 'DEVICE_COMMAND':
      return isRu ? 'Команда устройству' : 'Device command';
    case 'NOTIFY':
      return isRu ? 'Уведомление' : 'Notify';
    case 'HTTP_REQUEST':
      return isRu ? 'HTTP-запрос' : 'HTTP request';
  }
}

function conditionTitle(c: ScenarioConditionV1, isRu: boolean) {
  switch (c.type) {
    case 'ALWAYS':
      return isRu ? 'Всегда' : 'Always';
    case 'TIME_WINDOW':
      return isRu ? 'Окно времени' : 'Time window';
    case 'DEVICE_STATE':
      return isRu ? 'Состояние устройства' : 'Device state';
    case 'AND':
      return isRu ? 'И' : 'AND';
    case 'OR':
      return isRu ? 'ИЛИ' : 'OR';
    case 'NOT':
      return isRu ? 'НЕ' : 'NOT';
  }
}

function nodeToTrigger(n: ScenarioPlannerNode): ScenarioTriggerV1 {
  const d = (n.data ?? {}) as any;
  switch (n.kind) {
    case 'MANUAL':
      return { type: 'MANUAL', enabled: d.enabled ?? true };
    case 'SCHEDULE':
      return { type: 'SCHEDULE', cron: d.cron ?? '* * * * *', timezone: d.timezone, enabled: d.enabled ?? true };
    case 'DEVICE_EVENT':
      return { type: 'DEVICE_EVENT', deviceId: d.deviceId ?? '', event: d.event ?? '', payload: d.payload, enabled: d.enabled ?? true };
    case 'WEBHOOK':
      return { type: 'WEBHOOK', token: d.token ?? '', enabled: d.enabled ?? true };
    default:
      return { type: 'MANUAL', enabled: true };
  }
}

function nodeToAction(n: ScenarioPlannerNode): ScenarioActionV1 {
  const d = (n.data ?? {}) as any;
  switch (n.kind) {
    case 'DELAY':
      return { type: 'DELAY', ms: d.ms ?? 1000 };
    case 'DEVICE_COMMAND':
      return { type: 'DEVICE_COMMAND', deviceId: d.deviceId ?? '', command: d.command ?? '', args: d.args };
    case 'NOTIFY':
      return { type: 'NOTIFY', channel: d.channel ?? 'PUSH', title: d.title, message: d.message ?? '', data: d.data };
    case 'HTTP_REQUEST':
      return { type: 'HTTP_REQUEST', method: d.method ?? 'POST', url: d.url ?? 'https://example.com', headers: d.headers, body: d.body, timeoutMs: d.timeoutMs };
    default:
      return { type: 'DELAY', ms: 1000 };
  }
}

function nodeToCondition(n: ScenarioPlannerNode): ScenarioConditionV1 {
  const d = (n.data ?? {}) as any;
  switch (n.kind) {
    case 'ALWAYS':
      return { type: 'ALWAYS' };
    case 'TIME_WINDOW':
      return { type: 'TIME_WINDOW', from: d.from ?? '09:00', to: d.to ?? '18:00', timezone: d.timezone };
    case 'DEVICE_STATE':
      return { type: 'DEVICE_STATE', deviceId: d.deviceId ?? '', path: d.path ?? '', op: d.op ?? 'EQ', value: d.value ?? null };
    default:
      return { type: 'ALWAYS' };
  }
}

