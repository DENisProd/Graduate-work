'use client';

import type {
  RoomRequest,
  RoomResponse,
  DeviceTypeRequest,
  DeviceTypeResponse,
  DeviceCategoryRequest,
  DeviceCategoryResponse,
  DeviceRequest,
  DeviceResponse,
  DeviceFunctionRequest,
  DeviceFunctionResponse,
  DeviceFunctionActionRequest,
  DeviceFunctionActionResponse,
  PageRequest,
  PageResponse,
} from '@/types/api';
import {
  mockApi,
  mockRooms,
  mockDeviceTypes,
  mockDeviceCategories,
  mockDevices,
  mockDeviceFunctions,
  mockDeviceFunctionActions,
} from '../mocks';
import { apiCall, accessApiCall, safeApiCall, USE_MOCKS, buildPageQuery } from './core';

// Rooms are served by device-service at /api/v1/rooms
export const roomsApi = {
  getAll: (): Promise<RoomResponse[]> =>
    safeApiCall(() => apiCall('/api/v1/rooms'), () => mockApi.rooms.getAll()),

  getById: (id: number): Promise<RoomResponse> =>
    safeApiCall(() => apiCall(`/api/v1/rooms/${id}`), () => mockApi.rooms.getById(id)),

  create: (data: RoomRequest): Promise<RoomResponse> => {
    const mock = () =>
      Promise.resolve({
        ...mockRooms[0],
        id: Date.now(),
        code: data.code,
        name: data.translations.en?.name || data.code,
      });
    return USE_MOCKS
      ? mock()
      : safeApiCall(
          () => apiCall('/api/v1/rooms', { method: 'POST', body: JSON.stringify(data) }),
          mock,
        );
  },

  update: (id: number, data: RoomRequest): Promise<RoomResponse> => {
    const mock = () =>
      mockApi.rooms
        .getById(id)
        .then((room) => ({ ...room, ...data, name: data.translations.en?.name || room.name }));
    return USE_MOCKS
      ? mock()
      : safeApiCall(
          () => apiCall(`/api/v1/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
          mock,
        );
  },

  delete: (id: number): Promise<void> =>
    USE_MOCKS
      ? Promise.resolve()
      : safeApiCall(
          () => apiCall(`/api/v1/rooms/${id}`, { method: 'DELETE' }),
          () => Promise.resolve(),
        ),
};

export const deviceTypesApi = {
  // Public read endpoints
  getAll: (): Promise<DeviceTypeResponse[]> =>
    safeApiCall(
      () => accessApiCall<DeviceTypeResponse[]>('/v1/admin/device-types'),
      () => mockApi.deviceTypes.getAll(),
    ),

  getById: (id: number): Promise<DeviceTypeResponse> =>
    safeApiCall(
      () => accessApiCall(`/v1/device-types/${id}`),
      () => mockApi.deviceTypes.getById(id),
    ),

  getByCode: (code: string): Promise<DeviceTypeResponse> => {
    const mock = () =>
      mockApi.deviceTypes
        .getAll()
        .then((types) => types.find((t) => t.code === code) || Promise.reject(new Error('Not found')));
    return USE_MOCKS
      ? mock()
      : safeApiCall(() => accessApiCall(`/v1/device-types/code/${code}`), mock);
  },

  // Admin write endpoints
  create: (data: DeviceTypeRequest): Promise<DeviceTypeResponse> => {
    const mock = () =>
      Promise.resolve({
        ...mockDeviceTypes[0],
        id: Date.now(),
        code: data.code,
        name: data.translations.en?.name || data.code,
      });
    return USE_MOCKS
      ? mock()
      : safeApiCall(
          () => accessApiCall('/v1/admin/device-types', { method: 'POST', body: JSON.stringify(data) }),
          mock,
        );
  },

  update: (id: number, data: DeviceTypeRequest): Promise<DeviceTypeResponse> => {
    const mock = () =>
      mockApi.deviceTypes
        .getById(id)
        .then((type) => ({ ...type, ...data, name: data.translations.en?.name || type.name }));
    return USE_MOCKS
      ? mock()
      : safeApiCall(
          () =>
            accessApiCall(`/v1/admin/device-types/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
          mock,
        );
  },

  delete: (id: number): Promise<void> =>
    USE_MOCKS
      ? Promise.resolve()
      : safeApiCall(
          () => accessApiCall(`/v1/admin/device-types/${id}`, { method: 'DELETE' }),
          () => Promise.resolve(),
        ),
};

export const deviceCategoriesApi = {
  // Public read endpoints
  getAll: (): Promise<DeviceCategoryResponse[]> =>
    safeApiCall(
      () => accessApiCall('/v1/device-categories/all'),
      () => mockApi.deviceCategories.getAll(),
    ),

  getById: (id: number): Promise<DeviceCategoryResponse> =>
    safeApiCall(
      () => accessApiCall(`/v1/device-categories/${id}`),
      () => mockApi.deviceCategories.getById(id),
    ),

  getByCode: (code: string): Promise<DeviceCategoryResponse> => {
    const mock = () =>
      mockApi.deviceCategories
        .getAll()
        .then((cats) => cats.find((c) => c.code === code) || Promise.reject(new Error('Not found')));
    return USE_MOCKS
      ? mock()
      : safeApiCall(() => accessApiCall(`/v1/device-categories/code/${code}`), mock);
  },

  getByDeviceTypeId: (deviceTypeId: number): Promise<DeviceCategoryResponse[]> => {
    const mock = () =>
      mockApi.deviceCategories
        .getAll()
        .then((cats) => cats.filter((c) => c.deviceTypeId === deviceTypeId));
    return USE_MOCKS
      ? mock()
      : safeApiCall(() => accessApiCall(`/v1/device-categories/by-type/${deviceTypeId}`), mock);
  },

  // Admin write endpoints
  create: (data: DeviceCategoryRequest): Promise<DeviceCategoryResponse> => {
    const mock = () =>
      Promise.resolve({
        ...mockDeviceCategories[0],
        id: Date.now(),
        code: data.code,
        name: data.translations.en?.name || data.code,
        deviceTypeId: data.deviceTypeId,
      });
    return USE_MOCKS
      ? mock()
      : safeApiCall(
          () =>
            accessApiCall('/v1/admin/device-categories', { method: 'POST', body: JSON.stringify(data) }),
          mock,
        );
  },

  update: (id: number, data: DeviceCategoryRequest): Promise<DeviceCategoryResponse> => {
    const mock = () =>
      mockApi.deviceCategories
        .getById(id)
        .then((cat) => ({ ...cat, ...data, name: data.translations.en?.name || cat.name }));
    return USE_MOCKS
      ? mock()
      : safeApiCall(
          () =>
            accessApiCall(`/v1/admin/device-categories/${id}`, {
              method: 'PUT',
              body: JSON.stringify(data),
            }),
          mock,
        );
  },

  delete: (id: number): Promise<void> =>
    USE_MOCKS
      ? Promise.resolve()
      : safeApiCall(
          () => accessApiCall(`/v1/admin/device-categories/${id}`, { method: 'DELETE' }),
          () => Promise.resolve(),
        ),
};

export const devicesApi = {
  // Public read endpoints
  getAll: (params?: PageRequest): Promise<PageResponse<DeviceResponse>> => {
    if (USE_MOCKS) return mockApi.devices.getAll(params);
    return safeApiCall(
      () => accessApiCall(`/v1/devices${buildPageQuery(params)}`),
      () => mockApi.devices.getAll(params),
    );
  },

  getById: (id: number): Promise<DeviceResponse> =>
    safeApiCall(() => accessApiCall(`/v1/devices/${id}`), () => mockApi.devices.getById(id)),

  getDetailed: (id: number): Promise<DeviceResponse> =>
    safeApiCall(() => accessApiCall(`/v1/devices/${id}/detailed`), () => mockApi.devices.getById(id)),

  getByCode: (code: string): Promise<DeviceResponse> =>
    accessApiCall(`/v1/devices/code/${code}`),

  getByCategory: (categoryId: number, params?: PageRequest): Promise<DeviceResponse[]> => {
    const mock = () =>
      mockApi.devices
        .getAll()
        .then((page) => page.content.filter((d) => d.deviceCategoryId === categoryId));
    return USE_MOCKS
      ? mock()
      : safeApiCall(async () => {
          const res = await accessApiCall<PageResponse<DeviceResponse>>(
            `/v1/devices/by-category/${categoryId}${buildPageQuery(params)}`,
          );
          return res.content ?? [];
        }, mock);
  },

  updateStatus: (id: number, status: string): Promise<DeviceResponse> =>
    accessApiCall(`/v1/devices/${id}/status?status=${encodeURIComponent(status)}`, { method: 'PATCH' }),

  // Admin write endpoints
  create: (data: DeviceRequest): Promise<DeviceResponse> => {
    const mock = () =>
      Promise.resolve({
        ...mockDevices[0],
        id: Date.now(),
        code: data.code,
        name: data.name ?? data.code,
        deviceCategoryId: data.deviceCategoryId,
      });
    return USE_MOCKS
      ? mock()
      : safeApiCall(
          () => accessApiCall('/v1/admin/devices', { method: 'POST', body: JSON.stringify(data) }),
          mock,
        );
  },

  update: (id: number, data: DeviceRequest): Promise<DeviceResponse> => {
    const mock = () => mockApi.devices.getById(id).then((device) => ({ ...device, ...data }));
    return USE_MOCKS
      ? mock()
      : safeApiCall(
          () =>
            accessApiCall(`/v1/admin/devices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
          mock,
        );
  },

  /** Hard delete — admin only */
  delete: (id: number): Promise<void> =>
    USE_MOCKS
      ? Promise.resolve()
      : safeApiCall(
          () => accessApiCall(`/v1/admin/devices/${id}`, { method: 'DELETE' }),
          () => Promise.resolve(),
        ),

  /** Soft delete (deactivate) — public endpoint */
  deactivate: (id: number): Promise<void> =>
    accessApiCall(`/v1/devices/${id}`, { method: 'PATCH' }),
};

export const deviceFunctionsApi = {
  getById: (id: number): Promise<DeviceFunctionResponse> =>
    safeApiCall(
      () => accessApiCall(`/v1/device-functions/${id}`),
      () => mockApi.deviceFunctions.getById(id),
    ),

  getDetailed: (id: number): Promise<DeviceFunctionResponse> =>
    safeApiCall(
      () => accessApiCall(`/v1/device-functions/${id}/detailed`),
      () => mockApi.deviceFunctions.getById(id),
    ),

  getByDeviceId: (deviceId: number): Promise<DeviceFunctionResponse[]> =>
    safeApiCall(
      () => accessApiCall(`/v1/device-functions/by-device/${deviceId}/all`),
      () => mockApi.deviceFunctions.getAll().then((funcs) => funcs.filter((f) => f.deviceId === deviceId)),
    ),

  getWritableByDeviceId: (deviceId: number): Promise<DeviceFunctionResponse[]> =>
    accessApiCall(`/v1/device-functions/by-device/${deviceId}/writable`),

  updateValue: (id: number, value: string): Promise<DeviceFunctionResponse> =>
    accessApiCall(`/v1/device-functions/${id}/value?value=${encodeURIComponent(value)}`, {
      method: 'PATCH',
    }),

  // Admin write endpoints
  create: (data: DeviceFunctionRequest): Promise<DeviceFunctionResponse> => {
    const mock = () =>
      Promise.resolve({
        ...mockDeviceFunctions[0],
        id: Date.now(),
        code: data.code,
        name: data.translations.en?.name || data.code,
        deviceId: data.deviceId,
        functionType: data.functionType,
      });
    return USE_MOCKS
      ? mock()
      : safeApiCall(
          () =>
            accessApiCall('/v1/admin/device-functions', { method: 'POST', body: JSON.stringify(data) }),
          mock,
        );
  },

  update: (id: number, data: DeviceFunctionRequest): Promise<DeviceFunctionResponse> => {
    const mock = () =>
      mockApi.deviceFunctions
        .getById(id)
        .then((func) => ({ ...func, ...data, name: data.translations.en?.name || func.name }));
    return USE_MOCKS
      ? mock()
      : safeApiCall(
          () =>
            accessApiCall(`/v1/admin/device-functions/${id}`, {
              method: 'PUT',
              body: JSON.stringify(data),
            }),
          mock,
        );
  },

  delete: (id: number): Promise<void> =>
    USE_MOCKS
      ? Promise.resolve()
      : safeApiCall(
          () => accessApiCall(`/v1/admin/device-functions/${id}`, { method: 'DELETE' }),
          () => Promise.resolve(),
        ),
};

export const deviceFunctionActionsApi = {
  getById: (id: number): Promise<DeviceFunctionActionResponse> =>
    safeApiCall(
      () => accessApiCall(`/v1/device-function-actions/${id}`),
      () => mockApi.deviceFunctionActions.getById(id),
    ),

  getByDeviceFunctionId: (deviceFunctionId: number): Promise<DeviceFunctionActionResponse[]> =>
    safeApiCall(
      () => accessApiCall(`/v1/device-function-actions/by-function/${deviceFunctionId}/all`),
      () =>
        mockApi.deviceFunctionActions
          .getAll()
          .then((actions) => actions.filter((a) => a.deviceFunctionId === deviceFunctionId)),
    ),

  getByDeviceId: (deviceId: number): Promise<DeviceFunctionActionResponse[]> =>
    safeApiCall(
      () => accessApiCall(`/v1/device-function-actions/by-device/${deviceId}/all`),
      () => mockApi.deviceFunctionActions.getAll(),
    ),

  execute: (id: number): Promise<DeviceFunctionActionResponse> =>
    accessApiCall(`/v1/device-function-actions/${id}/execute`, { method: 'POST' }),

  // Admin write endpoints
  create: (data: DeviceFunctionActionRequest): Promise<DeviceFunctionActionResponse> => {
    const mock = () =>
      Promise.resolve({
        ...mockDeviceFunctionActions[0],
        id: Date.now(),
        code: data.code,
        name: data.translations.en?.name || data.code,
        deviceFunctionId: data.deviceFunctionId,
        actionType: data.actionType,
      });
    return USE_MOCKS
      ? mock()
      : safeApiCall(
          () =>
            accessApiCall('/v1/admin/device-function-actions', {
              method: 'POST',
              body: JSON.stringify(data),
            }),
          mock,
        );
  },

  update: (id: number, data: DeviceFunctionActionRequest): Promise<DeviceFunctionActionResponse> => {
    const mock = () =>
      mockApi.deviceFunctionActions
        .getById(id)
        .then((action) => ({ ...action, ...data, name: data.translations.en?.name || action.name }));
    return USE_MOCKS
      ? mock()
      : safeApiCall(
          () =>
            accessApiCall(`/v1/admin/device-function-actions/${id}`, {
              method: 'PUT',
              body: JSON.stringify(data),
            }),
          mock,
        );
  },

  delete: (id: number): Promise<void> =>
    USE_MOCKS
      ? Promise.resolve()
      : safeApiCall(
          () => accessApiCall(`/v1/admin/device-function-actions/${id}`, { method: 'DELETE' }),
          () => Promise.resolve(),
        ),
};
