'use client';

import { useState } from 'react';
import type { ScenarioTriggerConfig } from '../../types/widget.types';
import type { ScenarioResponse } from '@/types/api';
import { scenariosApi } from '@/lib/api/scenario-service';

interface Props {
  config: ScenarioTriggerConfig;
  scenario?: ScenarioResponse;
  readOnly?: boolean;
}

const STYLE_MAP = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  success: 'bg-green-600 hover:bg-green-700 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
};

export function ScenarioTriggerWidget({ config, scenario, readOnly = false }: Props) {
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<'ok' | 'error' | null>(null);

  const scenarioName = scenario?.name ?? config.label;

  async function handleTrigger() {
    if (loading || !config.scenarioId) return;
    if (config.confirmRequired && !confirm(`Запустить сценарий "${scenarioName}"?`)) return;
    setLoading(true);
    setLastResult(null);
    try {
      await scenariosApi.update(config.scenarioId, { status: 'ONLINE' });
      setLastResult('ok');
    } catch {
      setLastResult('error');
    } finally {
      setLoading(false);
      setTimeout(() => setLastResult(null), 3000);
    }
  }

  if (readOnly) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-2 px-3 text-center">
        <p className="text-sm font-medium text-foreground truncate w-full">{scenarioName}</p>
        <p className="text-xs text-muted-foreground">Только просмотр</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full items-center justify-center gap-2 px-3">
      {scenarioName && scenarioName !== config.label && (
        <p className="text-xs text-muted-foreground text-center truncate w-full">{scenarioName}</p>
      )}
      <button
        onClick={handleTrigger}
        disabled={loading || !config.scenarioId}
        className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 ${STYLE_MAP[config.buttonStyle]}`}
      >
        {loading ? 'Запуск...' : config.label}
      </button>
      {lastResult === 'ok' && <p className="text-xs text-green-600">Запущен</p>}
      {lastResult === 'error' && <p className="text-xs text-red-500">Ошибка</p>}
      {!config.scenarioId && (
        <p className="text-xs text-muted-foreground">Сценарий не выбран</p>
      )}
    </div>
  );
}
