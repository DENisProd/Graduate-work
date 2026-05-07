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
import { WIDGET_META_MAP } from '../lib/widget-registry';
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
import type { PhysicalDeviceResponse, ScenarioResponse, ZigbeeDeviceListItem } from '@/types/api';
import type {
  TelemetryValueConfig,
  DeviceStatusConfig,
  ControlButtonConfig,
  ControlToggleConfig,
  ScenarioTriggerConfig,
  TextLabelConfig,
} from '../types/widget.types';
import { widgetDashboardsApi } from '@/lib/api/scenario-service';


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
  const [editMode, setEditMode] = useState(false);
  const [widgets, setWidgets] = useState<WidgetInstance[]>(dashboard.widgets ?? []);
  const [layouts, setLayouts] = useState<ResponsiveLayouts>(
    (dashboard.layouts as ResponsiveLayouts) ?? {},
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<WidgetInstance | null>(null);
  const [saving, setSaving] = useState(false);
  const layoutDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  function addWidget(type: WidgetType) {
    const meta = WIDGET_META_MAP[type];
    const id = nanoid();
    const newWidget: WidgetInstance = {
      id,
      type,
      config: { type, ...meta.defaultConfig } as WidgetInstance['config'],
    };
    const newLayout: WidgetLayout = {
      i: id,
      x: 0,
      y: Infinity,
      w: meta.defaultSize.w,
      h: meta.defaultSize.h,
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
          .catch(() => {});
      }, 800);
    },
    [dashboard.id],
  );

  async function handleSave() {
    setSaving(true);
    try {
      await widgetDashboardsApi.update(dashboard.id, { widgets, layouts: layouts as unknown as Record<string, unknown> });
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
            className="px-4 py-2 rounded-lg border border-primary text-primary text-sm hover:bg-primary/10"
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
