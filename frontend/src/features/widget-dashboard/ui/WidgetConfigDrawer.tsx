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
  GaugeDialConfig,
  CircularProgressConfig,
  SliderControlConfig,
  DeviceHeroConfig,
  DeviceHeroStat,
  MiniLineChartConfig,
  HouseFloorPlanConfig,
  ModbusRegisterValueConfig,
  ModbusRegisterControlConfig,
  CommandValueType,
  WidgetCommandSource,
} from '../types/widget.types';
import type { PhysicalDeviceResponse, ScenarioResponse, ZigbeeStateWire, ModbusDeviceResponse, ModbusRegisterResponse } from '@/types/api';
import { modbusApi } from '@/lib/api-client';

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

function NumberInput({
  value,
  onChange,
  placeholder,
  step,
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  placeholder?: string;
  step?: number;
}) {
  return (
    <input
      type="number"
      value={value ?? ''}
      step={step}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === '') return onChange(undefined);
        const n = Number(raw);
        onChange(Number.isNaN(n) ? undefined : n);
      }}
      placeholder={placeholder}
      className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
    />
  );
}

function ChipsEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((c, i) => (
          <span
            key={c + i}
            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-accent text-foreground"
          >
            {c}
            <button
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Удалить"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && draft.trim()) {
              e.preventDefault();
              if (value.length < 3) onChange([...value, draft.trim()]);
              setDraft('');
            }
          }}
          placeholder={placeholder ?? 'Добавить тег + Enter'}
          className="flex-1 px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          onClick={() => {
            if (draft.trim() && value.length < 3) {
              onChange([...value, draft.trim()]);
              setDraft('');
            }
          }}
          className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-accent"
        >
          +
        </button>
      </div>
      <p className="text-[10px] text-muted-foreground">До 3 тегов</p>
    </div>
  );
}

function StatsEditor({
  value,
  onChange,
  payloadOptions,
}: {
  value: DeviceHeroStat[];
  onChange: (v: DeviceHeroStat[]) => void;
  payloadOptions: { value: string; label: string }[];
}) {
  const ICON_OPTS: { value: DeviceHeroStat['icon']; label: string }[] = [
    { value: 'cube', label: 'Куб (площадь)' },
    { value: 'bolt', label: 'Молния (батарея/энергия)' },
    { value: 'clock', label: 'Часы (время)' },
    { value: 'droplet', label: 'Капля (влажность)' },
    { value: 'flame', label: 'Огонь (нагрев)' },
    { value: 'leaf', label: 'Лист (эко)' },
  ];

  function update(i: number, patch: Partial<DeviceHeroStat>) {
    onChange(value.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  return (
    <div className="flex flex-col gap-2">
      {value.map((stat, i) => (
        <div key={i} className="border border-border rounded-lg p-2 flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <PayloadKeySelect
              value={stat.key}
              onChange={(v) => update(i, { key: v })}
              options={payloadOptions}
              placeholder="payload-ключ"
            />
            <select
              value={stat.icon}
              onChange={(e) => update(i, { icon: e.target.value as DeviceHeroStat['icon'] })}
              className="w-full px-2 py-1.5 text-xs bg-background border border-border rounded-lg"
            >
              {ICON_OPTS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-[1fr_80px_auto] gap-2">
            <input
              value={stat.caption}
              onChange={(e) => update(i, { caption: e.target.value })}
              placeholder="Подпись"
              className="px-2 py-1 text-xs bg-background border border-border rounded-lg"
            />
            <input
              value={stat.unit ?? ''}
              onChange={(e) => update(i, { unit: e.target.value })}
              placeholder="ед."
              className="px-2 py-1 text-xs bg-background border border-border rounded-lg"
            />
            <button
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="px-2 py-1 text-xs rounded-lg text-rose-600 hover:bg-rose-50"
            >
              Удалить
            </button>
          </div>
        </div>
      ))}
      {value.length < 3 && (
        <button
          onClick={() =>
            onChange([
              ...value,
              { key: '', icon: 'bolt', caption: 'Новая метрика', unit: '' },
            ])
          }
          className="text-xs px-2 py-1 rounded-lg border border-dashed border-border hover:bg-accent"
        >
          + Добавить метрику
        </button>
      )}
    </div>
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

function SourceSwitch({ value, onChange }: { value: WidgetCommandSource; onChange: (v: WidgetCommandSource) => void }) {
  return (
    <div className="flex gap-1 rounded-lg border border-border p-1">
      {(['zigbee', 'modbus'] as const).map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
            value === opt ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'
          }`}
        >
          {opt === 'zigbee' ? 'Zigbee устройство' : 'Modbus регистр'}
        </button>
      ))}
    </div>
  );
}

function CommandValueEditor({
  commandKey,
  commandValue,
  commandValueType,
  onChange,
}: {
  commandKey: string;
  commandValue: string;
  commandValueType: CommandValueType;
  onChange: (updates: { commandKey?: string; commandValue?: string; commandValueType?: CommandValueType }) => void;
}) {
  const isQuickOn = commandValueType === 'text' && commandValue === 'ON';
  const isQuickOff = commandValueType === 'text' && commandValue === 'OFF';
  const isCustom = !isQuickOn && !isQuickOff;

  return (
    <>
      <Field label="Ключ команды">
        <Input value={commandKey} onChange={(v) => onChange({ commandKey: v })} placeholder="state" />
      </Field>
      <Field label="Значение">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange({ commandValue: 'ON', commandValueType: 'text' })}
            className={`flex-1 rounded-lg border px-3 py-1.5 text-sm font-medium ${isQuickOn ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent'}`}
          >
            ВКЛ
          </button>
          <button
            type="button"
            onClick={() => onChange({ commandValue: 'OFF', commandValueType: 'text' })}
            className={`flex-1 rounded-lg border px-3 py-1.5 text-sm font-medium ${isQuickOff ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent'}`}
          >
            ВЫКЛ
          </button>
          <button
            type="button"
            onClick={() => { if (!isCustom) onChange({ commandValue: '', commandValueType: 'text' }); }}
            className={`flex-1 rounded-lg border px-3 py-1.5 text-sm font-medium ${isCustom ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent'}`}
          >
            Другое…
          </button>
        </div>
      </Field>
      {isCustom && (
        <div className="grid grid-cols-[120px_1fr] gap-2">
          <select
            value={commandValueType}
            onChange={(e) => onChange({ commandValueType: e.target.value as CommandValueType })}
            className="w-full px-2 py-1.5 text-xs bg-background border border-border rounded-lg"
          >
            <option value="text">Текст</option>
            <option value="number">Число</option>
            <option value="boolean">Логическое</option>
          </select>
          {commandValueType === 'boolean' ? (
            <select
              value={commandValue === 'true' ? 'true' : 'false'}
              onChange={(e) => onChange({ commandValue: e.target.value })}
              className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg"
            >
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          ) : (
            <input
              type={commandValueType === 'number' ? 'number' : 'text'}
              value={commandValue}
              onChange={(e) => onChange({ commandValue: e.target.value })}
              className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
            />
          )}
        </div>
      )}
    </>
  );
}

function ModbusTargetEditor({
  modbusDeviceId,
  modbusRegisterId,
  allowedTypes,
  modbusDevices,
  registers,
  onSelectDevice,
  onSelectRegister,
}: {
  modbusDeviceId: string;
  modbusRegisterId: string;
  allowedTypes: Array<'coil' | 'holding'>;
  modbusDevices: ModbusDeviceResponse[];
  registers: ModbusRegisterResponse[];
  onSelectDevice: (deviceId: string) => void;
  onSelectRegister: (registerId: string, registerType?: 'coil' | 'holding') => void;
}) {
  const deviceOptions = modbusDevices.map((d) => ({ value: d.id, label: d.name }));
  const registerOptions = registers
    .filter((r) => r.writable && allowedTypes.includes(r.registerType as 'coil' | 'holding'))
    .map((r) => ({ value: r.id, label: `${r.name} (${r.registerType} @${r.address})` }));

  return (
    <>
      <Field label="Modbus устройство">
        <Select value={modbusDeviceId} onChange={onSelectDevice} options={deviceOptions} />
      </Field>
      <Field label="Регистр">
        <Select
          value={modbusRegisterId}
          onChange={(v) => {
            const reg = registers.find((r) => r.id === v);
            onSelectRegister(v, reg?.registerType as 'coil' | 'holding' | undefined);
          }}
          options={registerOptions}
        />
      </Field>
    </>
  );
}

function widgetUsesModbus(type: WidgetInstance['type']): boolean {
  return (
    type === 'CONTROL_BUTTON' ||
    type === 'CONTROL_TOGGLE' ||
    type === 'DEVICE_HERO' ||
    type === 'MODBUS_REGISTER_VALUE' ||
    type === 'MODBUS_REGISTER_CONTROL'
  );
}

function getActiveModbusDeviceId(cfg: WidgetInstance['config'] | null): string {
  if (!cfg) return '';
  if (cfg.type === 'DEVICE_HERO') return (cfg as DeviceHeroConfig).toggleModbusDeviceId ?? '';
  if (cfg.type === 'CONTROL_BUTTON' || cfg.type === 'CONTROL_TOGGLE' || cfg.type === 'MODBUS_REGISTER_VALUE' || cfg.type === 'MODBUS_REGISTER_CONTROL') {
    return (cfg as unknown as { modbusDeviceId?: string }).modbusDeviceId ?? '';
  }
  return '';
}

export function WidgetConfigDrawer({ widget, devices, scenarios, states, onClose, onSave }: Props) {
  const [config, setConfig] = useState<WidgetInstance['config'] | null>(null);
  const [modbusDevices, setModbusDevices] = useState<ModbusDeviceResponse[]>([]);
  const [modbusRegistersByDevice, setModbusRegistersByDevice] = useState<Record<string, ModbusRegisterResponse[]>>({});

  useEffect(() => {
    if (widget) setConfig(JSON.parse(JSON.stringify(widget.config)) as typeof widget.config);
  }, [widget]);

  useEffect(() => {
    if (!widget || !widgetUsesModbus(widget.type)) return;
    modbusApi.listDevices().then(setModbusDevices).catch(() => {});
  }, [widget]);

  const activeModbusDeviceId = getActiveModbusDeviceId(config);

  useEffect(() => {
    if (!activeModbusDeviceId) return;
    modbusApi.listRegisters(activeModbusDeviceId).then((regs) => {
      setModbusRegistersByDevice((prev) => ({ ...prev, [activeModbusDeviceId]: regs }));
    }).catch(() => {});
  }, [activeModbusDeviceId]);

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

  const modbusDeviceOptions = modbusDevices.map((d) => ({ value: d.id, label: d.name }));

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
        const source = c.source ?? 'zigbee';
        const registersForDevice = modbusRegistersByDevice[c.modbusDeviceId ?? ''] ?? [];
        return (
          <>
            <Field label="Источник команды">
              <SourceSwitch value={source} onChange={(v) => patch({ source: v })} />
            </Field>
            {source === 'zigbee' ? (
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
                <CommandValueEditor
                  commandKey={c.commandKey ?? 'state'}
                  commandValue={c.commandValue ?? 'ON'}
                  commandValueType={c.commandValueType ?? 'text'}
                  onChange={(p) => patch(p)}
                />
              </>
            ) : (
              <>
                <ModbusTargetEditor
                  modbusDeviceId={c.modbusDeviceId ?? ''}
                  modbusRegisterId={c.modbusRegisterId ?? ''}
                  allowedTypes={['coil', 'holding']}
                  modbusDevices={modbusDevices}
                  registers={registersForDevice}
                  onSelectDevice={(v) => patch({ modbusDeviceId: v, modbusRegisterId: '', modbusRegisterType: undefined })}
                  onSelectRegister={(v, type) => patch({ modbusRegisterId: v, modbusRegisterType: type })}
                />
                {c.modbusRegisterType === 'holding' ? (
                  <Field label="Значение (число)">
                    <NumberInput
                      value={c.commandValue ? Number(c.commandValue) : undefined}
                      onChange={(v) => patch({ commandValue: v != null ? String(v) : '' })}
                    />
                  </Field>
                ) : (
                  <Field label="Значение">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => patch({ commandValue: 'true' })}
                        className={`flex-1 rounded-lg border px-3 py-1.5 text-sm font-medium ${c.commandValue === 'true' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent'}`}
                      >
                        ВКЛ
                      </button>
                      <button
                        type="button"
                        onClick={() => patch({ commandValue: 'false' })}
                        className={`flex-1 rounded-lg border px-3 py-1.5 text-sm font-medium ${c.commandValue === 'false' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent'}`}
                      >
                        ВЫКЛ
                      </button>
                    </div>
                  </Field>
                )}
              </>
            )}
            <Field label="Текст кнопки">
              <Input value={c.label} onChange={(v) => patch({ label: v })} placeholder="Включить" />
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
        const source = c.source ?? 'zigbee';
        const ctKeyOptions = getPayloadKeyOptions(states.get(c.physicalDeviceId));
        const registersForDevice = modbusRegistersByDevice[c.modbusDeviceId ?? ''] ?? [];
        return (
          <>
            <Field label="Источник">
              <SourceSwitch value={source} onChange={(v) => patch({ source: v })} />
            </Field>
            <Field label="Подпись">
              <Input value={c.label} onChange={(v) => patch({ label: v })} placeholder="Свет в гостиной" />
            </Field>
            {source === 'zigbee' ? (
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
                <Field label="Ключ состояния">
                  <PayloadKeySelect
                    value={c.statePayloadKey}
                    onChange={(v) => patch({ statePayloadKey: v })}
                    options={ctKeyOptions}
                    placeholder="state"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Значение ВКЛ">
                    <Input value={c.onValue ?? 'ON'} onChange={(v) => patch({ onValue: v })} placeholder="ON" />
                  </Field>
                  <Field label="Значение ВЫКЛ">
                    <Input value={c.offValue ?? 'OFF'} onChange={(v) => patch({ offValue: v })} placeholder="OFF" />
                  </Field>
                </div>
              </>
            ) : (
              <ModbusTargetEditor
                modbusDeviceId={c.modbusDeviceId ?? ''}
                modbusRegisterId={c.modbusRegisterId ?? ''}
                allowedTypes={['coil']}
                modbusDevices={modbusDevices}
                registers={registersForDevice}
                onSelectDevice={(v) => patch({ modbusDeviceId: v, modbusRegisterId: '' })}
                onSelectRegister={(v) => patch({ modbusRegisterId: v })}
              />
            )}
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
      case 'GAUGE_DIAL': {
        const c = config as GaugeDialConfig;
        const opts = getPayloadKeyOptions(states.get(c.physicalDeviceId));
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
            <Field label="Ключ payload">
              <PayloadKeySelect
                value={c.payloadKey}
                onChange={(v) => patch({ payloadKey: v })}
                options={opts}
                placeholder="temperature"
              />
            </Field>
            <Field label="Подпись">
              <Input value={c.label ?? ''} onChange={(v) => patch({ label: v })} placeholder="Климат-контроль" />
            </Field>
            <Field label="Единица измерения">
              <Input value={c.unit ?? ''} onChange={(v) => patch({ unit: v })} placeholder="°C" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Минимум">
                <NumberInput value={c.min} onChange={(v) => patch({ min: v ?? 0 })} placeholder="0" />
              </Field>
              <Field label="Максимум">
                <NumberInput value={c.max} onChange={(v) => patch({ max: v ?? 100 })} placeholder="100" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Жёлтый порог">
                <NumberInput value={c.warnAt} onChange={(v) => patch({ warnAt: v })} />
              </Field>
              <Field label="Красный порог">
                <NumberInput value={c.criticalAt} onChange={(v) => patch({ criticalAt: v })} />
              </Field>
            </div>
            <Field label="Теги-режимы">
              <ChipsEditor value={c.chips ?? []} onChange={(v) => patch({ chips: v })} />
            </Field>
            <Field label="Цвет акцента">
              <Select
                value={c.accent}
                onChange={(v) => patch({ accent: v })}
                options={[
                  { value: 'green', label: 'Зелёный' },
                  { value: 'blue', label: 'Синий' },
                  { value: 'amber', label: 'Жёлтый' },
                  { value: 'red', label: 'Красный' },
                ]}
              />
            </Field>
          </>
        );
      }
      case 'CIRCULAR_PROGRESS': {
        const c = config as CircularProgressConfig;
        const opts = getPayloadKeyOptions(states.get(c.physicalDeviceId ?? ''));
        return (
          <>
            <Field label="Заголовок">
              <Input value={c.title} onChange={(v) => patch({ title: v })} placeholder="Дом под контролем" />
            </Field>
            <Field label="Подзаголовок">
              <Input
                value={c.subtitle ?? ''}
                onChange={(v) => patch({ subtitle: v })}
                placeholder=""
              />
            </Field>
            <Field label="Устройство (необязательно)">
              <Select
                value={c.physicalDeviceId ?? ''}
                onChange={(v) => patch({ physicalDeviceId: v || undefined, payloadKey: v ? c.payloadKey : undefined })}
                options={deviceOptions}
              />
            </Field>
            {c.physicalDeviceId && (
              <Field label="Ключ payload">
                <PayloadKeySelect
                  value={c.payloadKey ?? ''}
                  onChange={(v) => patch({ payloadKey: v })}
                  options={opts}
                  placeholder="battery"
                />
              </Field>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Статичное значение">
                <NumberInput
                  value={c.staticValue}
                  onChange={(v) => patch({ staticValue: v })}
                  placeholder="78"
                />
              </Field>
              <Field label="Максимум">
                <NumberInput value={c.max} onChange={(v) => patch({ max: v ?? 100 })} placeholder="100" />
              </Field>
            </div>
            <Field label="Единица">
              <Input value={c.unit ?? ''} onChange={(v) => patch({ unit: v })} placeholder="%" />
            </Field>
            <Field label="Бейдж">
              <Input value={c.badge ?? ''} onChange={(v) => patch({ badge: v })} placeholder="Защищено" />
            </Field>
            <Field label="Цвет акцента">
              <Select
                value={c.accent}
                onChange={(v) => patch({ accent: v })}
                options={[
                  { value: 'green', label: 'Зелёный' },
                  { value: 'blue', label: 'Синий' },
                  { value: 'amber', label: 'Жёлтый' },
                  { value: 'red', label: 'Красный' },
                ]}
              />
            </Field>
          </>
        );
      }
      case 'SLIDER_CONTROL': {
        const c = config as SliderControlConfig;
        const opts = getPayloadKeyOptions(states.get(c.physicalDeviceId));
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
            <Field label="Подпись">
              <Input value={c.label} onChange={(v) => patch({ label: v })} placeholder="Освещение" />
            </Field>
            <Field label="Подзаголовок">
              <Input value={c.subtitle ?? ''} onChange={(v) => patch({ subtitle: v })} />
            </Field>
            <Field label="Ключ чтения значения">
              <PayloadKeySelect
                value={c.payloadKey}
                onChange={(v) => patch({ payloadKey: v, commandKey: c.commandKey || v })}
                options={opts}
                placeholder="brightness"
              />
            </Field>
            <Field label="Ключ команды (если отличается)">
              <Input
                value={c.commandKey ?? ''}
                onChange={(v) => patch({ commandKey: v })}
                placeholder="brightness"
              />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Min">
                <NumberInput value={c.min} onChange={(v) => patch({ min: v ?? 0 })} placeholder="0" />
              </Field>
              <Field label="Max">
                <NumberInput value={c.max} onChange={(v) => patch({ max: v ?? 254 })} placeholder="254" />
              </Field>
              <Field label="Шаг">
                <NumberInput value={c.step} onChange={(v) => patch({ step: v })} placeholder="1" />
              </Field>
            </div>
            <Field label="Единица">
              <Input value={c.unit ?? ''} onChange={(v) => patch({ unit: v })} />
            </Field>
            <Field label="Цвет">
              <Select
                value={c.accent}
                onChange={(v) => patch({ accent: v })}
                options={[
                  { value: 'green', label: 'Зелёный' },
                  { value: 'blue', label: 'Синий' },
                  { value: 'amber', label: 'Жёлтый' },
                ]}
              />
            </Field>
          </>
        );
      }
      case 'DEVICE_HERO': {
        const c = config as DeviceHeroConfig;
        const opts = getPayloadKeyOptions(states.get(c.physicalDeviceId));
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
            <Field label="Заголовок">
              <Input value={c.title} onChange={(v) => patch({ title: v })} placeholder="Передняя камера" />
            </Field>
            <Field label="Подзаголовок (модель)">
              <Input
                value={c.subtitle ?? ''}
                onChange={(v) => patch({ subtitle: v })}
                placeholder={selectedDevice?.model ?? ''}
              />
            </Field>
            <Field label="Иконка">
              <Select
                value={c.icon}
                onChange={(v) => patch({ icon: v as DeviceHeroConfig['icon'] })}
                options={[
                  { value: 'camera', label: 'Камера' },
                  { value: 'lightbulb', label: 'Лампочка' },
                  { value: 'fan', label: 'Вентилятор' },
                  { value: 'lock', label: 'Замок' },
                  { value: 'speaker', label: 'Колонка' },
                  { value: 'sparkles', label: 'Уборка/освежитель' },
                  { value: 'thermometer', label: 'Термометр' },
                  { value: 'broom', label: 'Метла (пылесос)' },
                ]}
              />
            </Field>
            <Field label="">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={c.showToggle}
                  onChange={(e) => patch({ showToggle: e.target.checked })}
                  className="rounded"
                />
                Показывать переключатель ON/OFF
              </label>
            </Field>
            {c.showToggle && (
              <>
                <Field label="Источник переключателя">
                  <SourceSwitch value={c.toggleSource ?? 'zigbee'} onChange={(v) => patch({ toggleSource: v })} />
                </Field>
                {(c.toggleSource ?? 'zigbee') === 'zigbee' ? (
                  <>
                    <Field label="Ключ состояния">
                      <PayloadKeySelect
                        value={c.togglePayloadKey ?? ''}
                        onChange={(v) => patch({ togglePayloadKey: v })}
                        options={opts}
                        placeholder="state"
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Значение ВКЛ">
                        <Input value={c.toggleOnValue ?? 'ON'} onChange={(v) => patch({ toggleOnValue: v })} placeholder="ON" />
                      </Field>
                      <Field label="Значение ВЫКЛ">
                        <Input value={c.toggleOffValue ?? 'OFF'} onChange={(v) => patch({ toggleOffValue: v })} placeholder="OFF" />
                      </Field>
                    </div>
                  </>
                ) : (
                  <ModbusTargetEditor
                    modbusDeviceId={c.toggleModbusDeviceId ?? ''}
                    modbusRegisterId={c.toggleModbusRegisterId ?? ''}
                    allowedTypes={['coil']}
                    modbusDevices={modbusDevices}
                    registers={modbusRegistersByDevice[c.toggleModbusDeviceId ?? ''] ?? []}
                    onSelectDevice={(v) => patch({ toggleModbusDeviceId: v, toggleModbusRegisterId: '' })}
                    onSelectRegister={(v) => patch({ toggleModbusRegisterId: v })}
                  />
                )}
              </>
            )}
            <Field label="Теги (до 3)">
              <ChipsEditor value={c.chips ?? []} onChange={(v) => patch({ chips: v })} />
            </Field>
            <Field label="Метрики (до 3)">
              <StatsEditor
                value={c.stats ?? []}
                onChange={(v) => patch({ stats: v })}
                payloadOptions={opts}
              />
            </Field>
            <Field label="Цвет">
              <Select
                value={c.accent}
                onChange={(v) => patch({ accent: v })}
                options={[
                  { value: 'green', label: 'Зелёный' },
                  { value: 'blue', label: 'Синий' },
                  { value: 'amber', label: 'Жёлтый' },
                  { value: 'slate', label: 'Серый (нейтральный)' },
                ]}
              />
            </Field>
          </>
        );
      }
      case 'MINI_LINE_CHART': {
        const c = config as MiniLineChartConfig;
        const opts = getPayloadKeyOptions(states.get(c.physicalDeviceId));
        return (
          <>
            <Field label="Устройство">
              <Select
                value={c.physicalDeviceId}
                onChange={(v) => patch({ physicalDeviceId: v })}
                options={deviceOptions}
              />
            </Field>
            <Field label="Ключ payload">
              <PayloadKeySelect
                value={c.payloadKey}
                onChange={(v) => patch({ payloadKey: v })}
                options={opts}
                placeholder="energy"
              />
            </Field>
            <Field label="Заголовок">
              <Input value={c.title} onChange={(v) => patch({ title: v })} placeholder="Потребление" />
            </Field>
            <Field label="Единица">
              <Input value={c.unit ?? ''} onChange={(v) => patch({ unit: v })} placeholder="кВт·ч" />
            </Field>
            <Field label="Размер буфера">
              <NumberInput
                value={c.bufferSize}
                onChange={(v) => patch({ bufferSize: v })}
                placeholder="60"
              />
            </Field>
            <Field label="Цвет">
              <Select
                value={c.accent}
                onChange={(v) => patch({ accent: v })}
                options={[
                  { value: 'green', label: 'Зелёный' },
                  { value: 'blue', label: 'Синий' },
                  { value: 'amber', label: 'Жёлтый' },
                  { value: 'red', label: 'Красный' },
                ]}
              />
            </Field>
          </>
        );
      }
      case 'HOUSE_FLOOR_PLAN': {
        const c = config as HouseFloorPlanConfig;
        return (
          <>
            <Field label="Заголовок">
              <Input
                value={c.label ?? ''}
                onChange={(v) => patch({ label: v })}
                placeholder="Планировка дома"
              />
            </Field>
            <Field label="">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={c.showDeviceLabels}
                  onChange={(e) => patch({ showDeviceLabels: e.target.checked })}
                  className="rounded"
                />
                Показывать названия устройств
              </label>
            </Field>
            <Field label="">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={c.showMetrics}
                  onChange={(e) => patch({ showMetrics: e.target.checked })}
                  className="rounded"
                />
                Показывать показатели в реальном времени
              </label>
            </Field>
          </>
        );
      }
      case 'MODBUS_REGISTER_VALUE': {
        const c = config as ModbusRegisterValueConfig;
        const registersForDevice = modbusRegistersByDevice[c.modbusDeviceId ?? ''] ?? [];
        const registerOptions = registersForDevice.map((r) => ({
          value: r.id,
          label: `${r.name} (${r.registerType} @${r.address})`,
        }));
        return (
          <>
            <Field label="Modbus устройство">
              <Select
                value={c.modbusDeviceId}
                onChange={(v) => patch({ modbusDeviceId: v, modbusRegisterId: '' })}
                options={modbusDeviceOptions}
              />
            </Field>
            <Field label="Регистр">
              <Select value={c.modbusRegisterId} onChange={(v) => patch({ modbusRegisterId: v })} options={registerOptions} />
            </Field>
            <Field label="Подпись">
              <Input value={c.label ?? ''} onChange={(v) => patch({ label: v })} />
            </Field>
            <Field label="Единица">
              <Input value={c.unit ?? ''} onChange={(v) => patch({ unit: v })} />
            </Field>
            <Field label="Интервал обновления (сек)">
              <NumberInput value={c.refreshInterval} onChange={(v) => patch({ refreshInterval: v ?? 30 })} placeholder="30" />
            </Field>
            <Field label="Цвет акцента">
              <Select
                value={c.accent}
                onChange={(v) => patch({ accent: v })}
                options={[
                  { value: 'green', label: 'Зелёный' },
                  { value: 'blue', label: 'Синий' },
                  { value: 'amber', label: 'Жёлтый' },
                  { value: 'red', label: 'Красный' },
                ]}
              />
            </Field>
          </>
        );
      }
      case 'MODBUS_REGISTER_CONTROL': {
        const c = config as ModbusRegisterControlConfig;
        const registersForDevice = modbusRegistersByDevice[c.modbusDeviceId ?? ''] ?? [];
        const registerOptions = registersForDevice
          .filter((r) => r.writable)
          .map((r) => ({ value: r.id, label: `${r.name} (${r.registerType} @${r.address})` }));
        return (
          <>
            <Field label="Modbus устройство">
              <Select
                value={c.modbusDeviceId}
                onChange={(v) => patch({ modbusDeviceId: v, modbusRegisterId: '' })}
                options={modbusDeviceOptions}
              />
            </Field>
            <Field label="Регистр">
              <Select value={c.modbusRegisterId} onChange={(v) => patch({ modbusRegisterId: v })} options={registerOptions} />
            </Field>
            <Field label="Подпись">
              <Input value={c.label ?? ''} onChange={(v) => patch({ label: v })} />
            </Field>
            <Field label="Тип управления">
              <Select
                value={c.controlType}
                onChange={(v) => patch({ controlType: v })}
                options={[
                  { value: 'coil', label: 'Coil (переключатель)' },
                  { value: 'holding', label: 'Holding (числовой ввод)' },
                ]}
              />
            </Field>
            <Field label="Цвет">
              <Select
                value={c.accent}
                onChange={(v) => patch({ accent: v })}
                options={[
                  { value: 'green', label: 'Зелёный' },
                  { value: 'blue', label: 'Синий' },
                  { value: 'amber', label: 'Жёлтый' },
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
