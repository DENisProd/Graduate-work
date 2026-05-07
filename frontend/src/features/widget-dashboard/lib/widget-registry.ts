import type { WidgetMeta, WidgetType } from '../types/widget.types';

export const WIDGET_REGISTRY: WidgetMeta[] = [
  {
    type: 'TELEMETRY_VALUE',
    label: 'Показание датчика',
    description: 'Текущее значение функции устройства — температура, влажность, состояние',
    icon: 'Gauge',
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
    defaultConfig: {
      physicalDeviceId: '',
      payloadKey: 'temperature',
      label: '',
      unit: '',
      displayVariant: 'numeric',
    },
  },
  {
    type: 'DEVICE_STATUS',
    label: 'Статус устройства',
    description: 'Online / Offline, имя, последнее время активности',
    icon: 'Wifi',
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
    defaultConfig: {
      physicalDeviceId: '',
      label: '',
      showLastSeen: true,
    },
  },
  {
    type: 'CONTROL_BUTTON',
    label: 'Кнопка команды',
    description: 'Отправить Zigbee-команду по нажатию (включить, выключить, произвольный payload)',
    icon: 'MousePointerClick',
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
    defaultConfig: {
      physicalDeviceId: '',
      ieeeAddr: '',
      label: 'Выполнить',
      commandPayload: { state: 'ON' },
      buttonStyle: 'primary',
      confirmRequired: false,
    },
  },
  {
    type: 'CONTROL_TOGGLE',
    label: 'Тумблер включения',
    description: 'Переключить устройство между ON/OFF с отображением текущего состояния',
    icon: 'ToggleRight',
    defaultSize: { w: 4, h: 2 },
    minSize: { w: 3, h: 2 },
    defaultConfig: {
      physicalDeviceId: '',
      ieeeAddr: '',
      label: 'Включение',
      statePayloadKey: 'state',
      onPayload: { state: 'ON' },
      offPayload: { state: 'OFF' },
    },
  },
  {
    type: 'SCENARIO_TRIGGER',
    label: 'Запуск сценария',
    description: 'Кнопка для ручного запуска автоматизации',
    icon: 'Zap',
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
    defaultConfig: {
      scenarioId: '',
      label: 'Запустить',
      buttonStyle: 'primary',
      confirmRequired: false,
    },
  },
  {
    type: 'TEXT_LABEL',
    label: 'Текстовый блок',
    description: 'Заголовок или разделитель для группировки виджетов',
    icon: 'Type',
    defaultSize: { w: 6, h: 2 },
    minSize: { w: 2, h: 1 },
    defaultConfig: {
      text: 'Новый заголовок',
      align: 'left',
      fontSize: 'lg',
      style: 'title',
    },
  },
];

export const WIDGET_META_MAP = Object.fromEntries(
  WIDGET_REGISTRY.map((m) => [m.type, m]),
) as Record<WidgetType, WidgetMeta>;
