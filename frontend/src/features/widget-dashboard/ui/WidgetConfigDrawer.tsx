'use client';

import { useState, useEffect } from 'react';
import type {
  WidgetInstance,
  TelemetryValueConfig,
  DeviceStatusConfig,
  ControlButtonConfig,
  ControlToggleConfig,
  ScenarioTriggerConfig,
  TextLabelConfig,
} from '../types/widget.types';
import type { PhysicalDeviceResponse, ScenarioResponse, ZigbeeStateWire } from '@/types/api';

interface Props {
  widget: WidgetInstance | null;
  devices: PhysicalDeviceResponse[];
  scenarios: ScenarioResponse[];
  states: Map<string, ZigbeeStateWire>;
  onClose: () => void;
  onSave: (widget: WidgetInstance) => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
    />
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
    >
      <option value="">— выберите —</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function getPayloadKeyOptions(state: ZigbeeStateWire | undefined): { value: string; label: string }[] {
  if (!state) return [];
  const keys = new Set([
    ...Object.keys(state.payload),
    ...Object.keys(state.metrics as unknown as Record<string, unknown>),
  ]);
  return Array.from(keys).map((k) => ({ value: k, label: k }));
}

function PayloadKeySelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  if (options.length === 0) {
    return (
      <div className="flex flex-col gap-1">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <span className="text-xs text-muted-foreground">Телеметрия ещё не получена — введите ключ вручную</span>
      </div>
    );
  }
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
    >
      <option value="">— выберите ключ —</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export function WidgetConfigDrawer({ widget, devices, scenarios, states, onClose, onSave }: Props) {
  const [config, setConfig] = useState<WidgetInstance['config'] | null>(null);

  useEffect(() => {
    if (widget) setConfig(JSON.parse(JSON.stringify(widget.config)) as typeof widget.config);
  }, [widget]);

  if (!widget || !config) return null;

  function patch(updates: Record<string, unknown>) {
    setConfig((prev) => ({ ...prev!, ...updates } as typeof config));
  }

  const deviceOptions = devices.map((d) => ({
    value: d.id,
    label: d.friendlyName ?? d.name ?? d.id,
  }));

  const scenarioOptions = scenarios.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  const selectedDevice = devices.find(
    (d) => d.id === (config as unknown as Record<string, unknown>).physicalDeviceId,
  );

  function renderFields() {
    switch (config!.type) {
      case 'TELEMETRY_VALUE': {
        const c = config as TelemetryValueConfig;
        const tvKeyOptions = getPayloadKeyOptions(states.get(c.physicalDeviceId));
        return (
          <>
            <Field label="Устройство">
              <Select
                value={c.physicalDeviceId}
                onChange={(v) => {
                  const dev = devices.find((d) => d.id === v);
                  patch({ physicalDeviceId: v, ieeeAddr: dev?.protocolAddress ?? '', payloadKey: '' });
                }}
                options={deviceOptions}
              />
            </Field>
            <Field label="Ключ payload">
              <PayloadKeySelect
                value={c.payloadKey}
                onChange={(v) => patch({ payloadKey: v })}
                options={tvKeyOptions}
                placeholder="temperature"
              />
            </Field>
            <Field label="Подпись виджета">
              <Input value={c.label ?? ''} onChange={(v) => patch({ label: v })} placeholder="Температура в гостиной" />
            </Field>
            <Field label="Единица измерения">
              <Input value={c.unit ?? ''} onChange={(v) => patch({ unit: v })} placeholder="°C" />
            </Field>
            <Field label="Тип отображения">
              <Select
                value={c.displayVariant}
                onChange={(v) => patch({ displayVariant: v })}
                options={[
                  { value: 'numeric', label: 'Число' },
                  { value: 'badge', label: 'Метка (текст)' },
                  { value: 'boolean', label: 'Вкл/Выкл' },
                ]}
              />
            </Field>
          </>
        );
      }
      case 'DEVICE_STATUS': {
        const c = config as DeviceStatusConfig;
        return (
          <>
            <Field label="Устройство">
              <Select value={c.physicalDeviceId} onChange={(v) => patch({ physicalDeviceId: v })} options={deviceOptions} />
            </Field>
            <Field label="Подпись (необязательно)">
              <Input value={c.label ?? ''} onChange={(v) => patch({ label: v })} placeholder={selectedDevice?.friendlyName ?? ''} />
            </Field>
            <Field label="">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={c.showLastSeen}
                  onChange={(e) => patch({ showLastSeen: e.target.checked })}
                  className="rounded"
                />
                Показывать время последней активности
              </label>
            </Field>
          </>
        );
      }
      case 'CONTROL_BUTTON': {
        const c = config as ControlButtonConfig;
        return (
          <>
            <Field label="Устройство">
              <Select
                value={c.physicalDeviceId}
                onChange={(v) => {
                  const dev = devices.find((d) => d.id === v);
                  patch({ physicalDeviceId: v, ieeeAddr: dev?.protocolAddress ?? '' });
                }}
                options={deviceOptions}
              />
            </Field>
            <Field label="Текст кнопки">
              <Input value={c.label} onChange={(v) => patch({ label: v })} placeholder="Включить" />
            </Field>
            <Field label='Команда (JSON, например: {"state":"ON"})'>
              <textarea
                value={JSON.stringify(c.commandPayload, null, 2)}
                onChange={(e) => {
                  try { patch({ commandPayload: JSON.parse(e.target.value) }); } catch {}
                }}
                rows={3}
                className="w-full px-3 py-1.5 text-xs font-mono bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </Field>
            <Field label="Стиль кнопки">
              <Select
                value={c.buttonStyle}
                onChange={(v) => patch({ buttonStyle: v })}
                options={[
                  { value: 'primary', label: 'Основной (синий)' },
                  { value: 'danger', label: 'Опасный (красный)' },
                  { value: 'ghost', label: 'Контурный' },
                ]}
              />
            </Field>
            <Field label="">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!c.confirmRequired}
                  onChange={(e) => patch({ confirmRequired: e.target.checked })}
                  className="rounded"
                />
                Подтверждение перед отправкой
              </label>
            </Field>
          </>
        );
      }
      case 'CONTROL_TOGGLE': {
        const c = config as ControlToggleConfig;
        const ctKeyOptions = getPayloadKeyOptions(states.get(c.physicalDeviceId));
        return (
          <>
            <Field label="Устройство">
              <Select
                value={c.physicalDeviceId}
                onChange={(v) => {
                  const dev = devices.find((d) => d.id === v);
                  patch({ physicalDeviceId: v, ieeeAddr: dev?.protocolAddress ?? '', statePayloadKey: '' });
                }}
                options={deviceOptions}
              />
            </Field>
            <Field label="Подпись">
              <Input value={c.label} onChange={(v) => patch({ label: v })} placeholder="Свет в гостиной" />
            </Field>
            <Field label="Ключ состояния">
              <PayloadKeySelect
                value={c.statePayloadKey}
                onChange={(v) => patch({ statePayloadKey: v })}
                options={ctKeyOptions}
                placeholder="state"
              />
            </Field>
          </>
        );
      }
      case 'SCENARIO_TRIGGER': {
        const c = config as ScenarioTriggerConfig;
        return (
          <>
            <Field label="Сценарий">
              <Select value={c.scenarioId} onChange={(v) => patch({ scenarioId: v })} options={scenarioOptions} />
            </Field>
            <Field label="Текст кнопки">
              <Input value={c.label} onChange={(v) => patch({ label: v })} placeholder="Запустить" />
            </Field>
            <Field label="Стиль">
              <Select
                value={c.buttonStyle}
                onChange={(v) => patch({ buttonStyle: v })}
                options={[
                  { value: 'primary', label: 'Основной' },
                  { value: 'success', label: 'Зелёный' },
                  { value: 'danger', label: 'Красный' },
                ]}
              />
            </Field>
            <Field label="">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!c.confirmRequired}
                  onChange={(e) => patch({ confirmRequired: e.target.checked })}
                  className="rounded"
                />
                Подтверждение перед запуском
              </label>
            </Field>
          </>
        );
      }
      case 'TEXT_LABEL': {
        const c = config as TextLabelConfig;
        return (
          <>
            <Field label="Текст">
              <Input value={c.text} onChange={(v) => patch({ text: v })} placeholder="Заголовок секции" />
            </Field>
            <Field label="Размер">
              <Select
                value={c.fontSize}
                onChange={(v) => patch({ fontSize: v })}
                options={[
                  { value: 'sm', label: 'Маленький' },
                  { value: 'md', label: 'Средний' },
                  { value: 'lg', label: 'Большой (заголовок)' },
                  { value: 'xl', label: 'Очень большой' },
                ]}
              />
            </Field>
            <Field label="Выравнивание">
              <Select
                value={c.align}
                onChange={(v) => patch({ align: v })}
                options={[
                  { value: 'left', label: 'По левому краю' },
                  { value: 'center', label: 'По центру' },
                  { value: 'right', label: 'По правому краю' },
                ]}
              />
            </Field>
            <Field label="Стиль">
              <Select
                value={c.style}
                onChange={(v) => patch({ style: v })}
                options={[
                  { value: 'title', label: 'Заголовок' },
                  { value: 'subtitle', label: 'Подзаголовок' },
                  { value: 'body', label: 'Текст' },
                  { value: 'divider', label: 'Разделитель' },
                ]}
              />
            </Field>
          </>
        );
      }
      default:
        return <p className="text-sm text-muted-foreground">Нет настроек для этого типа виджета.</p>;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="h-full w-full max-w-sm bg-background border-l border-border shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold">Настройки виджета</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {renderFields()}
        </div>
        <div className="px-5 py-4 border-t border-border flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-border text-sm hover:bg-accent"
          >
            Отмена
          </button>
          <button
            onClick={() => {
              if (config) onSave({ ...widget, config });
              onClose();
            }}
            className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
