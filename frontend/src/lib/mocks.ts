// Mock data for development
import type {
  RoomResponse,
  DeviceTypeResponse,
  DeviceCategoryResponse,
  DeviceResponse,
  DeviceFunctionResponse,
  DeviceFunctionActionResponse,
  PageResponse,
} from '@/types/api';

// Mock Rooms
export const mockRooms: RoomResponse[] = [
  {
    id: 1,
    code: 'LIVING_ROOM',
    name: 'Living Room',
    description: 'Main living area',
    active: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    translations: {
      en: { locale: 'en', name: 'Living Room', description: 'Main living area' },
      ru: { locale: 'ru', name: 'Гостиная', description: 'Основная жилая зона' },
    },
  },
  {
    id: 2,
    code: 'BEDROOM',
    name: 'Bedroom',
    description: 'Master bedroom',
    active: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    translations: {
      en: { locale: 'en', name: 'Bedroom', description: 'Master bedroom' },
      ru: { locale: 'ru', name: 'Спальня', description: 'Главная спальня' },
    },
  },
  {
    id: 3,
    code: 'KITCHEN',
    name: 'Kitchen',
    description: 'Kitchen area',
    active: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    translations: {
      en: { locale: 'en', name: 'Kitchen', description: 'Kitchen area' },
      ru: { locale: 'ru', name: 'Кухня', description: 'Кухонная зона' },
    },
  },
];

// Mock Device Types
export const mockDeviceTypes: DeviceTypeResponse[] = [
  {
    id: 1,
    code: 'LIGHT',
    name: 'Light',
    description: 'Lighting device',
    active: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    translations: {
      en: { locale: 'en', name: 'Light', description: 'Lighting device' },
      ru: { locale: 'ru', name: 'Свет', description: 'Осветительное устройство' },
    },
  },
  {
    id: 2,
    code: 'THERMOSTAT',
    name: 'Thermostat',
    description: 'Temperature control device',
    active: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    translations: {
      en: { locale: 'en', name: 'Thermostat', description: 'Temperature control device' },
      ru: { locale: 'ru', name: 'Термостат', description: 'Устройство управления температурой' },
    },
  },
  {
    id: 3,
    code: 'SENSOR',
    name: 'Sensor',
    description: 'Sensor device',
    active: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    translations: {
      en: { locale: 'en', name: 'Sensor', description: 'Sensor device' },
      ru: { locale: 'ru', name: 'Датчик', description: 'Сенсорное устройство' },
    },
  },
];

// Mock Device Categories
export const mockDeviceCategories: DeviceCategoryResponse[] = [
  {
    id: 1,
    code: 'LED_LIGHT',
    name: 'LED Light',
    description: 'LED lighting',
    deviceTypeId: 1,
    active: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    translations: {
      en: { locale: 'en', name: 'LED Light', description: 'LED lighting' },
      ru: { locale: 'ru', name: 'LED Свет', description: 'LED освещение' },
    },
  },
  {
    id: 2,
    code: 'SMART_BULB',
    name: 'Smart Bulb',
    description: 'Smart light bulb',
    deviceTypeId: 1,
    active: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    translations: {
      en: { locale: 'en', name: 'Smart Bulb', description: 'Smart light bulb' },
      ru: { locale: 'ru', name: 'Умная лампочка', description: 'Умная лампочка' },
    },
  },
  {
    id: 3,
    code: 'TEMPERATURE_SENSOR',
    name: 'Temperature Sensor',
    description: 'Temperature sensor',
    deviceTypeId: 3,
    active: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    translations: {
      en: { locale: 'en', name: 'Temperature Sensor', description: 'Temperature sensor' },
      ru: { locale: 'ru', name: 'Датчик температуры', description: 'Датчик температуры' },
    },
  },
];

// Mock Devices
export const mockDevices: DeviceResponse[] = [
  {
    id: 1,
    code: 'LIVING_ROOM_LIGHT_1',
    name: 'Living Room Light 1',
    description: 'Main light in living room',
    roomId: 1,
    roomName: 'Living Room',
    deviceCategoryId: 1,
    deviceCategoryName: 'LED Light',
    active: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    translations: {
      en: { locale: 'en', name: 'Living Room Light 1', description: 'Main light in living room' },
      ru: { locale: 'ru', name: 'Свет гостиной 1', description: 'Основной свет в гостиной' },
    },
  },
  {
    id: 2,
    code: 'BEDROOM_THERMOSTAT',
    name: 'Bedroom Thermostat',
    description: 'Temperature control in bedroom',
    roomId: 2,
    roomName: 'Bedroom',
    deviceCategoryId: 2,
    deviceCategoryName: 'Smart Bulb',
    active: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    translations: {
      en: { locale: 'en', name: 'Bedroom Thermostat', description: 'Temperature control in bedroom' },
      ru: { locale: 'ru', name: 'Термостат спальни', description: 'Управление температурой в спальне' },
    },
  },
  {
    id: 3,
    code: 'KITCHEN_SENSOR',
    name: 'Kitchen Temperature Sensor',
    description: 'Temperature sensor in kitchen',
    roomId: 3,
    roomName: 'Kitchen',
    deviceCategoryId: 3,
    deviceCategoryName: 'Temperature Sensor',
    active: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    translations: {
      en: { locale: 'en', name: 'Kitchen Temperature Sensor', description: 'Temperature sensor in kitchen' },
      ru: { locale: 'ru', name: 'Датчик температуры кухни', description: 'Датчик температуры на кухне' },
    },
  },
];

// Mock Device Functions
export const mockDeviceFunctions: DeviceFunctionResponse[] = [
  {
    id: 1,
    code: 'power',
    name: 'Power',
    description: 'Turn device on/off',
    deviceId: 1,
    functionType: 'READ_WRITE',
    currentValue: 'false',
    active: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    translations: {
      en: { locale: 'en', name: 'Power', description: 'Turn device on/off' },
      ru: { locale: 'ru', name: 'Питание', description: 'Включить/выключить устройство' },
    },
  },
  {
    id: 2,
    code: 'brightness',
    name: 'Brightness',
    description: 'Control brightness level',
    deviceId: 1,
    functionType: 'READ_WRITE',
    currentValue: '50',
    minValue: 0,
    maxValue: 100,
    unit: '%',
    active: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    translations: {
      en: { locale: 'en', name: 'Brightness', description: 'Control brightness level' },
      ru: { locale: 'ru', name: 'Яркость', description: 'Управление уровнем яркости' },
    },
  },
  {
    id: 3,
    code: 'temperature',
    name: 'Temperature',
    description: 'Current temperature',
    deviceId: 3,
    functionType: 'READ',
    currentValue: '22.5',
    minValue: -10,
    maxValue: 50,
    unit: '°C',
    active: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    translations: {
      en: { locale: 'en', name: 'Temperature', description: 'Current temperature' },
      ru: { locale: 'ru', name: 'Температура', description: 'Текущая температура' },
    },
  },
];

// Mock Device Function Actions
export const mockDeviceFunctionActions: DeviceFunctionActionResponse[] = [
  {
    id: 1,
    code: 'turn_on',
    name: 'Turn On',
    description: 'Turn device on',
    deviceFunctionId: 1,
    actionType: 'TURN_ON',
    active: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    translations: {
      en: { locale: 'en', name: 'Turn On', description: 'Turn device on' },
      ru: { locale: 'ru', name: 'Включить', description: 'Включить устройство' },
    },
  },
  {
    id: 2,
    code: 'turn_off',
    name: 'Turn Off',
    description: 'Turn device off',
    deviceFunctionId: 1,
    actionType: 'TURN_OFF',
    active: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    translations: {
      en: { locale: 'en', name: 'Turn Off', description: 'Turn device off' },
      ru: { locale: 'ru', name: 'Выключить', description: 'Выключить устройство' },
    },
  },
  {
    id: 3,
    code: 'set_brightness',
    name: 'Set Brightness',
    description: 'Set brightness value',
    deviceFunctionId: 2,
    actionType: 'SET_VALUE',
    payloadTemplate: '{"value": ${value}}',
    active: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    translations: {
      en: { locale: 'en', name: 'Set Brightness', description: 'Set brightness value' },
      ru: { locale: 'ru', name: 'Установить яркость', description: 'Установить значение яркости' },
    },
  },
];

// Helper function to simulate API delay
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock API functions that return mock data with delay
export const mockApi = {
  rooms: {
    getAll: async (): Promise<RoomResponse[]> => {
      await delay(500);
      return [...mockRooms];
    },
    getById: async (id: number): Promise<RoomResponse> => {
      await delay(300);
      const room = mockRooms.find((r) => r.id === id);
      if (!room) throw new Error('Room not found');
      return { ...room };
    },
  },
  deviceTypes: {
    getAll: async (): Promise<DeviceTypeResponse[]> => {
      await delay(500);
      return [...mockDeviceTypes];
    },
    getById: async (id: number): Promise<DeviceTypeResponse> => {
      await delay(300);
      const type = mockDeviceTypes.find((t) => t.id === id);
      if (!type) throw new Error('Device type not found');
      return { ...type };
    },
  },
  deviceCategories: {
    getAll: async (): Promise<DeviceCategoryResponse[]> => {
      await delay(500);
      return [...mockDeviceCategories];
    },
    getById: async (id: number): Promise<DeviceCategoryResponse> => {
      await delay(300);
      const category = mockDeviceCategories.find((c) => c.id === id);
      if (!category) throw new Error('Device category not found');
      return { ...category };
    },
  },
  devices: {
    getAll: async (params?: { page?: number; size?: number }): Promise<PageResponse<DeviceResponse>> => {
      await delay(500);
      const pageNum = params?.page || 0;
      const size = params?.size || 10;
      const start = pageNum * size;
      const end = start + size;
      const content = mockDevices.slice(start, end);
      return {
        content,
        page: pageNum,
        size,
        totalElements: mockDevices.length,
        totalPages: Math.ceil(mockDevices.length / size),
        first: pageNum === 0,
        last: end >= mockDevices.length,
        hasNext: end < mockDevices.length,
        hasPrevious: pageNum > 0,
      };
    },
    getById: async (id: number): Promise<DeviceResponse> => {
      await delay(300);
      const device = mockDevices.find((d) => d.id === id);
      if (!device) throw new Error('Device not found');
      return { ...device };
    },
  },
  deviceFunctions: {
    getAll: async (): Promise<DeviceFunctionResponse[]> => {
      await delay(500);
      return [...mockDeviceFunctions];
    },
    getById: async (id: number): Promise<DeviceFunctionResponse> => {
      await delay(300);
      const func = mockDeviceFunctions.find((f) => f.id === id);
      if (!func) throw new Error('Device function not found');
      return { ...func };
    },
  },
  deviceFunctionActions: {
    getAll: async (): Promise<DeviceFunctionActionResponse[]> => {
      await delay(500);
      return [...mockDeviceFunctionActions];
    },
    getById: async (id: number): Promise<DeviceFunctionActionResponse> => {
      await delay(300);
      const action = mockDeviceFunctionActions.find((a) => a.id === id);
      if (!action) throw new Error('Device function action not found');
      return { ...action };
    },
  },
};

