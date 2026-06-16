import type {
  WidgetDashboard,
  WidgetInstance,
  WidgetLayout,
} from '../types/widget.types';
import type { PhysicalDeviceResponse, ScenarioResponse } from '@/types/api';
import { connectivityFromLastOnline } from '@/lib/device-connectivity';
import type { getTranslation } from '@/lib/i18n';

type TranslateFn = (
  key: Parameters<typeof getTranslation>[1],
  params?: Record<string, string | number>,
) => string;

function nanoid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function deviceLabel(device: PhysicalDeviceResponse): string {
  return device.friendlyName || device.name || 'Устройство';
}

function matchesHint(text: string | null | undefined, hints: string[]): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return hints.some((h) => lower.includes(h));
}

function pickTemperatureDevice(devices: PhysicalDeviceResponse[]): PhysicalDeviceResponse | undefined {
  return (
    devices.find((d) =>
      matchesHint(d.model, ['temp', 'th', 'climate', 'sensor']) ||
      matchesHint(d.friendlyName, ['темп', 'temp', 'климат']),
    ) ?? devices[0]
  );
}

function pickLightDevice(devices: PhysicalDeviceResponse[]): PhysicalDeviceResponse | undefined {
  return (
    devices.find((d) =>
      matchesHint(d.model, ['light', 'bulb', 'lamp', 'dimmer']) ||
      matchesHint(d.friendlyName, ['свет', 'ламп', 'light']),
    ) ?? devices.find((d) => d.id !== pickTemperatureDevice(devices)?.id) ?? devices[0]
  );
}

function countOnline(devices: PhysicalDeviceResponse[]): { online: number; total: number } {
  const total = devices.length;
  const online = devices.filter(
    (d) => connectivityFromLastOnline(d.lastSeen) === 'ONLINE',
  ).length;
  return { online, total };
}

export interface BuildDefaultWidgetsInput {
  t: TranslateFn;
  houseId: string;
  devices: PhysicalDeviceResponse[];
  scenarios: ScenarioResponse[];
}

export function buildDefaultWidgets({
  t,
  houseId,
  devices,
  scenarios,
}: BuildDefaultWidgetsInput): {
  widgets: WidgetDashboard['widgets'];
  layouts: Record<string, WidgetLayout[]>;
} {
  const wFloor = nanoid();
  const wOnline = nanoid();
  const wClimate = nanoid();
  const wLight = nanoid();
  const wScenario = nanoid();

  const widgets: WidgetInstance[] = [
    {
      id: wFloor,
      type: 'HOUSE_FLOOR_PLAN',
      config: {
        type: 'HOUSE_FLOOR_PLAN',
        houseId,
        label: t('dashboard.overview.widgets.floorPlanTitle'),
        showDeviceLabels: true,
        showMetrics: true,
      },
    },
  ];

  const { online, total } = countOnline(devices);
  const onlinePct = total > 0 ? Math.round((online / total) * 100) : 0;

  widgets.push({
    id: wOnline,
    type: 'CIRCULAR_PROGRESS',
    config: {
      type: 'CIRCULAR_PROGRESS',
      title: t('dashboard.overview.widgets.devicesOnlineTitle'),
      subtitle:
        total > 0
          ? t('dashboard.overview.widgets.devicesOnlineSubtitle', { online, total })
          : t('dashboard.overview.widgets.noDevicesSubtitle'),
      staticValue: onlinePct,
      max: 100,
      unit: '%',
      badge:
        total > 0
          ? onlinePct >= 80
            ? t('dashboard.overview.widgets.badgeStable')
            : onlinePct >= 50
              ? t('dashboard.overview.widgets.badgeAttention')
              : t('dashboard.overview.widgets.badgeCheck')
          : t('dashboard.overview.widgets.badgeEmpty'),
      accent: onlinePct >= 80 ? 'green' : onlinePct >= 50 ? 'amber' : 'red',
    },
  });

  const tempDevice = pickTemperatureDevice(devices);
  if (tempDevice) {
    widgets.push({
      id: wClimate,
      type: 'GAUGE_DIAL',
      config: {
        type: 'GAUGE_DIAL',
        physicalDeviceId: tempDevice.id,
        payloadKey: 'temperature',
        label: deviceLabel(tempDevice),
        unit: '°C',
        min: 15,
        max: 32,
        warnAt: 28,
        chips: [t('dashboard.overview.widgets.climateChip')],
        accent: 'green',
      },
    });
  } else {
    widgets.push({
      id: wClimate,
      type: 'TEXT_LABEL',
      config: {
        type: 'TEXT_LABEL',
        text: `${t('dashboard.overview.widgets.climateTitle')}: ${t('dashboard.overview.widgets.climateHint')}`,
        align: 'left',
        fontSize: 'md',
        style: 'body',
      },
    });
  }

  const lightDevice = pickLightDevice(devices);
  if (lightDevice) {
    widgets.push({
      id: wLight,
      type: 'DEVICE_HERO',
      config: {
        type: 'DEVICE_HERO',
        physicalDeviceId: lightDevice.id,
        ieeeAddr: lightDevice.protocolAddress ?? undefined,
        title: deviceLabel(lightDevice),
        subtitle: lightDevice.model ?? '',
        icon: 'lightbulb',
        showToggle: true,
        toggleSource: 'zigbee',
        togglePayloadKey: 'state',
        toggleOnValue: 'ON',
        toggleOffValue: 'OFF',
        chips: [t('dashboard.overview.widgets.lightChip')],
        stats: [{ key: 'brightness', icon: 'bolt', caption: t('dashboard.overview.widgets.brightness'), unit: '%' }],
        accent: 'amber',
      },
    });
  } else {
    widgets.push({
      id: wLight,
      type: 'TEXT_LABEL',
      config: {
        type: 'TEXT_LABEL',
        text: `${t('dashboard.overview.widgets.tipTitle')}: ${t('dashboard.overview.widgets.tipBody')}`,
        align: 'left',
        fontSize: 'md',
        style: 'body',
      },
    });
  }

  const scenario = scenarios[0];
  if (scenario) {
    widgets.push({
      id: wScenario,
      type: 'SCENARIO_TRIGGER',
      config: {
        type: 'SCENARIO_TRIGGER',
        scenarioId: scenario.id,
        label: scenario.name || t('dashboard.overview.widgets.runScenario'),
        buttonStyle: 'primary',
        confirmRequired: false,
      },
    });
  }

  const widgetIds = widgets.map((w) => w.id);
  const hasScenario = Boolean(scenario);

  const lg: WidgetLayout[] = [
    { i: wFloor, x: 0, y: 0, w: 15, h: 9, minW: 8, minH: 6 },
    { i: wOnline, x: 15, y: 0, w: 9, h: 4, minW: 4, minH: 3 },
  ];

  if (hasScenario) {
    lg.push(
      { i: wClimate, x: 15, y: 4, w: 4, h: 4, minW: 4, minH: 3 },
      { i: wLight, x: 19, y: 4, w: 5, h: 5, minW: 4, minH: 4 },
      { i: wScenario, x: 15, y: 8, w: 9, h: 3, minW: 4, minH: 2 },
    );
  } else {
    lg.push(
      { i: wClimate, x: 15, y: 4, w: 9, h: 4, minW: 4, minH: 3 },
      { i: wLight, x: 15, y: 8, w: 9, h: 4, minW: 4, minH: 3 },
    );
  }

  const md: WidgetLayout[] = [
    { i: wFloor, x: 0, y: 0, w: 12, h: 8, minW: 6, minH: 5 },
    { i: wOnline, x: 0, y: 8, w: 6, h: 4, minW: 4, minH: 3 },
    { i: wClimate, x: 6, y: 8, w: 6, h: 4, minW: 4, minH: 3 },
    { i: wLight, x: 0, y: 12, w: 6, h: 5, minW: 4, minH: 4 },
  ];
  if (hasScenario) {
    md.push({ i: wScenario, x: 6, y: 12, w: 6, h: 3, minW: 4, minH: 2 });
  }

  const sm: WidgetLayout[] = widgetIds.map((id, index) => ({
    i: id,
    x: 0,
    y: index * 4,
    w: 6,
    h: id === wFloor ? 7 : 4,
    minW: 4,
    minH: id === wFloor ? 5 : 2,
  }));

  return { widgets, layouts: { lg, md, sm } };
}
