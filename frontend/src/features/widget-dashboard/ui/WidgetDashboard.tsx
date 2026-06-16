'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { ResponsiveGridLayout, useContainerWidth, type Layout, type LayoutItem, type ResponsiveLayouts } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import type {
  WidgetDashboard as WidgetDashboardType,
  WidgetInstance,
  WidgetLayout,
  WidgetType,
} from '../types/widget.types';
import { WIDGET_META_MAP, WIDGET_TEMPLATE_MAP } from '../lib/widget-registry';
import { useWidgetTelemetry } from '../lib/useWidgetTelemetry';
import { WidgetContainer } from './WidgetContainer';
import { WidgetPicker } from './WidgetPicker';
import { WidgetConfigDrawer } from './WidgetConfigDrawer';
import { WidgetDashboardToolbar } from './WidgetDashboardToolbar';
import { TelemetryValueWidget } from './widgets/TelemetryValueWidget';
import { DeviceStatusWidget } from './widgets/DeviceStatusWidget';
import { ControlButtonWidget } from './widgets/ControlButtonWidget';
import { ControlToggleWidget } from './widgets/ControlToggleWidget';
import { ScenarioTriggerWidget } from './widgets/ScenarioTriggerWidget';
import { TextLabelWidget } from './widgets/TextLabelWidget';
import { GaugeDialWidget } from './widgets/GaugeDialWidget';
import { CircularProgressWidget } from './widgets/CircularProgressWidget';
import { SliderControlWidget } from './widgets/SliderControlWidget';
import { DeviceHeroWidget } from './widgets/DeviceHeroWidget';
import { MiniLineChartWidget } from './widgets/MiniLineChartWidget';
import { FloorPlanWidget } from './widgets/FloorPlanWidget';
import { ModbusRegisterValueWidget, ModbusRegisterControlWidget } from './widgets/ModbusRegisterWidget';
import type { PhysicalDeviceResponse, ScenarioResponse, ZigbeeDeviceListItem } from '@/types/api';
import type {
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
  MiniLineChartConfig,
  HouseFloorPlanConfig,
  ModbusRegisterValueConfig,
  ModbusRegisterControlConfig,
} from '../types/widget.types';
import { widgetDashboardsApi } from '@/lib/api/scenario-service';
import { useToast } from '@/components/shared';


function nanoid(): string {
  return Math.random().toString(36).slice(2, 10);
}

interface Props {
  dashboard: WidgetDashboardType;
  devices: PhysicalDeviceResponse[];
  zigbeeDevices: ZigbeeDeviceListItem[];
  scenarios: ScenarioResponse[];
}

export function WidgetDashboard({ dashboard, devices, zigbeeDevices, scenarios }: Props) {
  const { showToast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [widgets, setWidgets] = useState<WidgetInstance[]>(dashboard.widgets ?? []);
  const [layouts, setLayouts] = useState<ResponsiveLayouts>(
    (dashboard.layouts as ResponsiveLayouts) ?? {},
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<WidgetInstance | null>(null);
  const [saving, setSaving] = useState(false);
  const layoutDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autosaveErrorToastTsRef = useRef<number>(0);

  const { states, connected, sendCommand } = useWidgetTelemetry(zigbeeDevices);
  const { width: containerWidth, containerRef, mounted: widthMounted } = useContainerWidth();

  const deviceMap = useMemo(
    () => Object.fromEntries(devices.map((d) => [d.id, d])),
    [devices],
  );

  const scenarioMap = useMemo(
    () => Object.fromEntries(scenarios.map((s) => [s.id, s])),
    [scenarios],
  );

  function getDeviceState(physicalDeviceId: string) {
    return states.get(physicalDeviceId) ?? undefined;
  }

  function addWidget(typeOrTemplateId: WidgetType | string) {
    const id = nanoid();
    const template = WIDGET_TEMPLATE_MAP[typeOrTemplateId as string];

    let newWidget: WidgetInstance;
    let size: { w: number; h: number };
    let minSize: { w: number; h: number };

    if (template) {
      newWidget = {
        id,
        type: template.type,
        config: { type: template.type, ...template.config } as WidgetInstance['config'],
      };
      if (template.type === 'HOUSE_FLOOR_PLAN') {
        (newWidget.config as HouseFloorPlanConfig).houseId = dashboard.houseId;
      }
      size = template.defaultSize;
      minSize = template.minSize;
    } else {
      const meta = WIDGET_META_MAP[typeOrTemplateId as WidgetType];
      newWidget = {
        id,
        type: typeOrTemplateId as WidgetType,
        config: { type: typeOrTemplateId as WidgetType, ...meta.defaultConfig } as WidgetInstance['config'],
      };
      if (typeOrTemplateId === 'HOUSE_FLOOR_PLAN') {
        (newWidget.config as HouseFloorPlanConfig).houseId = dashboard.houseId;
      }
      size = meta.defaultSize;
      minSize = meta.minSize;
    }

    const newLayout: WidgetLayout = {
      i: id,
      x: 0,
      y: Infinity,
      w: size.w,
      h: size.h,
      minW: minSize.w,
      minH: minSize.h,
    };
    setWidgets((prev) => [...prev, newWidget]);
    setLayouts((prev) => ({
      ...prev,
      lg: [...(prev.lg ?? []), { ...newLayout }],
      md: [...(prev.md ?? []), { ...newLayout }],
      sm: [...(prev.sm ?? []), { ...newLayout }],
    }));
    setEditingWidget(newWidget);
  }

  function deleteWidget(id: string) {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
    setLayouts((prev) => {
      const next: ResponsiveLayouts = {};
      for (const key of Object.keys(prev) as Array<keyof typeof prev>) {
        const arr = prev[key];
        if (arr) next[key] = arr.filter((l: LayoutItem) => l.i !== id);
      }
      return next;
    });
  }

  function duplicateWidget(widget: WidgetInstance) {
    const id = nanoid();
    const meta = WIDGET_META_MAP[widget.type];
    const currentLayout = (layouts.lg ?? []).find((l) => l.i === widget.id);
    const newWidget: WidgetInstance = { ...widget, id };
    const newLayout: WidgetLayout = {
      i: id,
      x: (currentLayout?.x ?? 0),
      y: Infinity,
      w: currentLayout?.w ?? meta.defaultSize.w,
      h: currentLayout?.h ?? meta.defaultSize.h,
      minW: meta.minSize.w,
      minH: meta.minSize.h,
    };
    setWidgets((prev) => [...prev, newWidget]);
    setLayouts((prev) => ({
      ...prev,
      lg: [...(prev.lg ?? []), { ...newLayout }],
      md: [...(prev.md ?? []), { ...newLayout }],
      sm: [...(prev.sm ?? []), { ...newLayout }],
    }));
  }

  function saveWidget(updated: WidgetInstance) {
    setWidgets((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
  }

  const handleLayoutChange = useCallback(
    (_layout: Layout, allLayouts: ResponsiveLayouts) => {
      setLayouts(allLayouts);
      if (layoutDebounceRef.current) clearTimeout(layoutDebounceRef.current);
      layoutDebounceRef.current = setTimeout(() => {
        widgetDashboardsApi
          .updateLayout(dashboard.id, allLayouts as Record<string, unknown>)
          .catch(() => {
            const now = Date.now();
            if (now - autosaveErrorToastTsRef.current > 6000) {
              autosaveErrorToastTsRef.current = now;
              showToast('Не удалось автосохранить расположение виджетов', 'warning', 4000);
            }
          });
      }, 800);
    },
    [dashboard.id, showToast],
  );

  async function handleSave() {
    setSaving(true);
    try {
      await widgetDashboardsApi.update(dashboard.id, { widgets, layouts: layouts as unknown as Record<string, unknown> });
      setEditingWidget(null);
      setEditMode(false);
      showToast('Сохранено', 'success', 2000);
    } catch (e) {
      showToast('Ошибка сохранения', 'error', 4000);
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    return () => {
      if (layoutDebounceRef.current) clearTimeout(layoutDebounceRef.current);
    };
  }, []);

  function renderWidgetContent(widget: WidgetInstance) {
    switch (widget.type) {
      case 'TELEMETRY_VALUE':
        return (
          <TelemetryValueWidget
            config={widget.config as TelemetryValueConfig}
            state={getDeviceState((widget.config as TelemetryValueConfig).physicalDeviceId)}
          />
        );
      case 'DEVICE_STATUS':
        return (
          <DeviceStatusWidget
            config={widget.config as DeviceStatusConfig}
            device={deviceMap[(widget.config as DeviceStatusConfig).physicalDeviceId]}
            state={getDeviceState((widget.config as DeviceStatusConfig).physicalDeviceId)}
          />
        );
      case 'CONTROL_BUTTON':
        return (
          <ControlButtonWidget
            config={widget.config as ControlButtonConfig}
            onCommand={sendCommand}
          />
        );
      case 'CONTROL_TOGGLE': {
        const cfg = widget.config as ControlToggleConfig;
        return (
          <ControlToggleWidget
            config={cfg}
            state={getDeviceState(cfg.physicalDeviceId)}
            onCommand={sendCommand}
          />
        );
      }
      case 'SCENARIO_TRIGGER':
        return (
          <ScenarioTriggerWidget
            config={widget.config as ScenarioTriggerConfig}
            scenario={scenarioMap[(widget.config as ScenarioTriggerConfig).scenarioId]}
          />
        );
      case 'TEXT_LABEL':
        return <TextLabelWidget config={widget.config as TextLabelConfig} />;
      case 'GAUGE_DIAL': {
        const cfg = widget.config as GaugeDialConfig;
        return (
          <GaugeDialWidget config={cfg} state={getDeviceState(cfg.physicalDeviceId)} />
        );
      }
      case 'CIRCULAR_PROGRESS': {
        const cfg = widget.config as CircularProgressConfig;
        return (
          <CircularProgressWidget
            config={cfg}
            state={cfg.physicalDeviceId ? getDeviceState(cfg.physicalDeviceId) : undefined}
          />
        );
      }
      case 'SLIDER_CONTROL': {
        const cfg = widget.config as SliderControlConfig;
        return (
          <SliderControlWidget
            config={cfg}
            state={getDeviceState(cfg.physicalDeviceId)}
            onCommand={sendCommand}
          />
        );
      }
      case 'DEVICE_HERO': {
        const cfg = widget.config as DeviceHeroConfig;
        return (
          <DeviceHeroWidget
            config={cfg}
            device={deviceMap[cfg.physicalDeviceId]}
            state={getDeviceState(cfg.physicalDeviceId)}
            onCommand={sendCommand}
          />
        );
      }
      case 'MINI_LINE_CHART': {
        const cfg = widget.config as MiniLineChartConfig;
        return <MiniLineChartWidget config={cfg} state={getDeviceState(cfg.physicalDeviceId)} />;
      }
      case 'HOUSE_FLOOR_PLAN': {
        const cfg = widget.config as HouseFloorPlanConfig;
        return (
          <FloorPlanWidget
            config={{ ...cfg, houseId: cfg.houseId || dashboard.houseId }}
            deviceMap={deviceMap}
            states={states}
          />
        );
      }
      case 'MODBUS_REGISTER_VALUE':
        return <ModbusRegisterValueWidget config={widget.config as ModbusRegisterValueConfig} />;
      case 'MODBUS_REGISTER_CONTROL':
        return <ModbusRegisterControlWidget config={widget.config as ModbusRegisterControlConfig} />;
      default:
        return <div className="p-3 text-sm text-muted-foreground">Неизвестный виджет</div>;
    }
  }

  const currentLayouts: ResponsiveLayouts = layouts && Object.keys(layouts).length > 0 ? layouts : { lg: [], md: [], sm: [] };

  return (
    <div className="flex flex-col h-full">
      <WidgetDashboardToolbar
        editMode={editMode}
        connected={connected}
        dashboardName={dashboard.name}
        saving={saving}
        onToggleEdit={() => setEditMode((v) => !v)}
        onSave={handleSave}
        onAddWidget={() => setPickerOpen(true)}
      />

      {widgets.length === 0 && !editMode && (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center p-8">
          <p className="text-muted-foreground text-sm">Дашборд пуст.</p>
          <button
            onClick={() => setEditMode(true)}
            className="rounded-lg border border-primary/70 bg-primary/8 px-4 py-2 text-sm text-primary hover:bg-primary/16 dark:border-primary dark:bg-primary/10 dark:hover:bg-primary/20"
          >
            Перейти в режим редактирования
          </button>
        </div>
      )}

      {(widgets.length > 0 || editMode) && (
        <div className="flex-1 overflow-auto p-3" ref={containerRef}>
          {widthMounted && <ResponsiveGridLayout
            width={containerWidth}
            className="layout"
            layouts={currentLayouts}
            breakpoints={{ lg: 1200, md: 768, sm: 480 }}
            cols={{ lg: 24, md: 12, sm: 6 }}
            rowHeight={50}
            dragConfig={{ enabled: editMode, handle: '.drag-handle' }}
            resizeConfig={{ enabled: editMode, handles: ['se'] }}
            onLayoutChange={handleLayoutChange}
            margin={[8, 8] as [number, number]}
          >
            {widgets.map((widget) => (
              <div key={widget.id}>
                <WidgetContainer
                  widget={widget}
                  editMode={editMode}
                  onEdit={setEditingWidget}
                  onDelete={deleteWidget}
                  onDuplicate={duplicateWidget}
                >
                  {renderWidgetContent(widget)}
                </WidgetContainer>
              </div>
            ))}
          </ResponsiveGridLayout>}
        </div>
      )}

      <WidgetPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={addWidget}
      />

      <WidgetConfigDrawer
        widget={editingWidget}
        devices={devices}
        scenarios={scenarios}
        states={states}
        onClose={() => setEditingWidget(null)}
        onSave={saveWidget}
      />
    </div>
  );
}
