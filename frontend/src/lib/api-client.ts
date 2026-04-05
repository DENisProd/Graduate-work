// API Client for backend communication
// For now, using mocks. Later can be replaced with real API calls

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
  HouseRequest,
  HouseResponse,
  HouseResourceTreeNode,
  HouseRoomRequest,
  HouseRoomResponse,
  HouseDeviceRegistrationRequest,
  HouseDeviceRegistrationResponse,
  HouseMemberResponse,
  HouseInvitationRequest,
  HouseInvitationResponse,
  HouseRoleResponse,
  HouseRoleCreateRequest,
  RoleMemberResponse,
  HousePolicyResponse,
  CreatePolicyRequestDto,
  CreateResourceRequestDto,
  ResourceResponseDto,
  CreateAccessRightDto,
  AccessRightResponse,
  AccessStructureResponse,
  HouseAccessRightRequestDto,
  HouseAccessRightResponse,
  AccessControlCheckRequestDto,
  AccessCheckResponse,
  ListResponse,
  PhysicalDeviceResponse,
  DeviceDataResponse,
  ZigbeeDeviceListItem,
  ZigbeeStateWire,
  ScenarioResponse,
} from '@/types/api';
import { env } from '@/config/env.config';
import { useUserStore } from '@/store/user-store';
import {
  mockApi,
  mockRooms,
  mockDeviceTypes,
  mockDeviceCategories,
  mockDevices,
  mockDeviceFunctions,
  mockDeviceFunctionActions,
} from './mocks';

// By default, use real API. Set NEXT_PUBLIC_USE_MOCKS=true to use mocks
const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';
const API_BASE_URL = env.API_BASE_URL;
const ACCESS_API_BASE_URL = env.ACCESS_API_BASE_URL;
const PHYSICAL_DEVICES_API_BASE_URL = env.PHYSICAL_DEVICES_API_BASE_URL;

type ApiCallOptions = RequestInit & { baseUrl?: string };
type ListParams = { page?: number; limit?: number; signal?: AbortSignal };

const accessApiCall = <T>(
  endpoint: string,
  options?: ApiCallOptions
) => apiCall<T>(endpoint, { ...options, baseUrl: ACCESS_API_BASE_URL });

const physicalDevicesApiCall = <T>(
  endpoint: string,
  options?: ApiCallOptions
) => apiCall<T>(endpoint, { ...options, baseUrl: PHYSICAL_DEVICES_API_BASE_URL });

/**
 * Access Control API client (microservice at ACCESS_API_BASE_URL, e.g. localhost:8085).
 * All methods use centralized apiCall with error handling (ApiError on non-2xx).
 */
export const accessApiClient = {
  houses: {
    /** GET /api/v1/houses — list houses (backend may return current user's or all) */
    getHouses: (params?: PageRequest): Promise<HouseResponse[] | PageResponse<HouseResponse>> => {
      const queryParams = new URLSearchParams();
      if (params?.page !== undefined) queryParams.append('page', params.page.toString());
      if (params?.size !== undefined) queryParams.append('size', params.size.toString());
      if (params?.sort) queryParams.append('sort', params.sort);
      const query = queryParams.toString();
      return accessApiCall(`/api/v1/houses${query ? `?${query}` : ''}`);
    },
    /** GET /api/v1/houses/user/:userId — houses where user is owner or member (for FE-002) */
    getHousesByUser: (userId: string, params?: PageRequest): Promise<HouseResponse[] | PageResponse<HouseResponse>> => {
      const queryParams = new URLSearchParams();
      if (params?.page !== undefined) queryParams.append('page', params.page.toString());
      if (params?.size !== undefined) queryParams.append('size', params.size.toString());
      if (params?.sort) queryParams.append('sort', params.sort);
      const query = queryParams.toString();
      return accessApiCall(`/api/v1/houses/user/${userId}${query ? `?${query}` : ''}`);
    },
    /** GET /api/v1/admin/houses — list all houses for admin */
    getAdminHouses: (params?: PageRequest): Promise<HouseResponse[] | PageResponse<HouseResponse>> => {
      const queryParams = new URLSearchParams();
      if (params?.page !== undefined) queryParams.append('page', params.page.toString());
      if (params?.size !== undefined) queryParams.append('size', params.size.toString());
      if (params?.sort) queryParams.append('sort', params.sort);
      const query = queryParams.toString();
      return accessApiCall(`/api/v1/admin/houses${query ? `?${query}` : ''}`);
    },
    /** GET /api/v1/admin/houses/owner/{ownerId} — list owner houses for admin */
    getAdminHousesByOwner: (
      ownerId: string,
      params?: PageRequest
    ): Promise<HouseResponse[] | PageResponse<HouseResponse>> => {
      const queryParams = new URLSearchParams();
      if (params?.page !== undefined) queryParams.append('page', params.page.toString());
      if (params?.size !== undefined) queryParams.append('size', params.size.toString());
      if (params?.sort) queryParams.append('sort', params.sort);
      const query = queryParams.toString();
      return accessApiCall(
        `/api/v1/admin/houses/owner/${encodeURIComponent(ownerId)}${query ? `?${query}` : ''}`
      );
    },
    /** GET /api/v1/houses/:id */
    getHouseById: (id: number): Promise<HouseResponse> =>
      accessApiCall(`/api/v1/houses/${id}`),
    /** POST /api/v1/houses */
    create: (data: HouseRequest): Promise<HouseResponse> =>
      accessApiCall('/api/v1/houses', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Helper function to get current locale from localStorage
function getCurrentLocale(): string {
  if (typeof window === 'undefined') return 'en';
  try {
    const stored = localStorage.getItem('smart-home-language');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed?.state?.locale || 'en';
    }
  } catch {
    // Fallback to default
  }
  return 'en';
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  const keys = ['keycloak-token', 'access_token', 'token', 'smart-home-token'];
  for (const key of keys) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'string') return parsed;
      if (parsed?.access_token) return parsed.access_token;
      if (parsed?.accessToken) return parsed.accessToken;
      if (parsed?.token) return parsed.token;
    } catch {
      return raw;
    }
  }
  return null;
}

/** Временное решение: id текущего пользователя из стора (для заголовка X-User-Id). */
function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return useUserStore.getState().user?.id ?? null;
}

// Helper function to make API calls
async function apiCall<T>(
  endpoint: string,
  options?: ApiCallOptions
): Promise<T> {
  const { baseUrl, ...requestOptions } = options || {};
  const url = `${baseUrl ?? API_BASE_URL}${endpoint}`;
  const locale = getCurrentLocale();
  const token = getAuthToken();
  const userId = getCurrentUserId();

  try {
    const response = await fetch(url, {
      ...requestOptions,
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': locale,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(userId ? { 'X-User-Id': userId } : {}),
        ...requestOptions.headers,
      },
    });

    if (!response.ok) {
      let errorData: Record<string, unknown> = {};
      try {
        const text = await response.text();
        if (text) {
          const parsed = JSON.parse(text) as unknown;
          if (parsed && typeof parsed === 'object') {
            errorData = parsed as Record<string, unknown>;
          }
        }
      } catch {
        // If parsing fails, use default error message
      }
      
      const message = errorData['message'];
      const error = errorData['error'];
      const errorMessage =
        (typeof message === 'string' && message) ||
        (typeof error === 'string' && error) ||
        `HTTP ${response.status}: ${response.statusText}` ||
        'Internal Server Error';
      
      throw new ApiError(
        errorMessage,
        response.status,
        errorData
      );
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      if (!text) {
        return {} as T;
      }
      return JSON.parse(text);
    }
    
    return {} as T;
  } catch (error) {
    if (error instanceof ApiError) {
      // If API returns error and we're not explicitly using real API, log warning
      if (USE_MOCKS && error.status >= 500) {
        console.warn(`API returned ${error.status} error. Using mocks by default. Set NEXT_PUBLIC_USE_MOCKS=false to use real API.`);
      }
      throw error;
    }
    // If it's a network error and we're not using mocks, suggest using mocks
    if (!USE_MOCKS && error instanceof TypeError) {
      console.warn('API request failed. Consider setting NEXT_PUBLIC_USE_MOCKS=true to use mock data.');
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error',
      0,
      error
    );
  }
}

// Helper to safely call API with optional fallback to mocks
async function safeApiCall<T>(
  apiCallFn: () => Promise<T>,
  mockFn: () => Promise<T>
): Promise<T> {
  if (USE_MOCKS) {
    return mockFn();
  }
  // For admin panel, don't fallback to mocks - throw error instead
  return await apiCallFn();
}

// Rooms API
export const roomsApi = {
  getAll: (): Promise<RoomResponse[]> =>
    safeApiCall(
      () => apiCall('/api/v1/rooms'),
      () => mockApi.rooms.getAll()
    ),
  getById: (id: number): Promise<RoomResponse> =>
    safeApiCall(
      () => apiCall(`/api/v1/rooms/${id}`),
      () => mockApi.rooms.getById(id)
    ),
  create: (data: RoomRequest): Promise<RoomResponse> =>
    USE_MOCKS
      ? Promise.resolve({ ...mockRooms[0], id: Date.now(), code: data.code, name: data.translations.en?.name || data.code })
      : safeApiCall(
          () => apiCall('/api/v1/rooms', {
            method: 'POST',
            body: JSON.stringify(data),
          }),
          () => Promise.resolve({ ...mockRooms[0], id: Date.now(), code: data.code, name: data.translations.en?.name || data.code })
        ),
  update: (id: number, data: RoomRequest): Promise<RoomResponse> =>
    USE_MOCKS
      ? mockApi.rooms.getById(id).then((room) => ({ ...room, ...data, name: data.translations.en?.name || room.name }))
      : safeApiCall(
          () => apiCall(`/api/v1/rooms/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
          }),
          () => mockApi.rooms.getById(id).then((room) => ({ ...room, ...data, name: data.translations.en?.name || room.name }))
        ),
  delete: (id: number): Promise<void> =>
    USE_MOCKS ? Promise.resolve() : safeApiCall(
      () => apiCall(`/api/v1/rooms/${id}`, { method: 'DELETE' }),
      () => Promise.resolve()
    ),
};

// Device Types API (Admin: /api/v1/admin/device-types — full CRUD with translations)
export const deviceTypesApi = {
  getAll: (): Promise<DeviceTypeResponse[]> =>
    safeApiCall(
      () => apiCall('/api/v1/admin/device-types'),
      () => mockApi.deviceTypes.getAll()
    ),
  getById: (id: number): Promise<DeviceTypeResponse> =>
    safeApiCall(
      () => apiCall(`/api/v1/admin/device-types/${id}`),
      () => mockApi.deviceTypes.getById(id)
    ),
  getByCode: (code: string): Promise<DeviceTypeResponse> =>
    USE_MOCKS
      ? mockApi.deviceTypes.getAll().then((types) => types.find((t) => t.code === code) || Promise.reject(new Error('Not found')))
      : safeApiCall(
          () => apiCall(`/api/v1/admin/device-types/code/${code}`),
          () => mockApi.deviceTypes.getAll().then((types) => types.find((t) => t.code === code) || Promise.reject(new Error('Not found')))
        ),
  create: (data: DeviceTypeRequest): Promise<DeviceTypeResponse> =>
    USE_MOCKS
      ? Promise.resolve({ ...mockDeviceTypes[0], id: Date.now(), code: data.code, name: data.translations.en?.name || data.code })
      : safeApiCall(
          () => apiCall('/api/v1/admin/device-types', {
            method: 'POST',
            body: JSON.stringify(data),
          }),
          () => Promise.resolve({ ...mockDeviceTypes[0], id: Date.now(), code: data.code, name: data.translations.en?.name || data.code })
        ),
  update: (id: number, data: DeviceTypeRequest): Promise<DeviceTypeResponse> =>
    USE_MOCKS
      ? mockApi.deviceTypes.getById(id).then((type) => ({ ...type, ...data, name: data.translations.en?.name || type.name }))
      : safeApiCall(
          () => apiCall(`/api/v1/admin/device-types/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
          }),
          () => mockApi.deviceTypes.getById(id).then((type) => ({ ...type, ...data, name: data.translations.en?.name || type.name }))
        ),
  delete: (id: number): Promise<void> =>
    USE_MOCKS ? Promise.resolve() : safeApiCall(
      () => apiCall(`/api/v1/admin/device-types/${id}`, { method: 'DELETE' }),
      () => Promise.resolve()
    ),
};

// Device Categories API (Admin: /api/v1/admin/device-categories — full CRUD with translations)
export const deviceCategoriesApi = {
  getAll: (): Promise<DeviceCategoryResponse[]> =>
    safeApiCall(
      () => apiCall('/api/v1/admin/device-categories/all'),
      () => mockApi.deviceCategories.getAll()
    ),
  getById: (id: number): Promise<DeviceCategoryResponse> =>
    safeApiCall(
      () => apiCall(`/api/v1/admin/device-categories/${id}`),
      () => mockApi.deviceCategories.getById(id)
    ),
  getByCode: (code: string): Promise<DeviceCategoryResponse> =>
    USE_MOCKS
      ? mockApi.deviceCategories.getAll().then((cats) => cats.find((c) => c.code === code) || Promise.reject(new Error('Not found')))
      : safeApiCall(
          () => apiCall(`/api/v1/admin/device-categories/code/${code}`),
          () => mockApi.deviceCategories.getAll().then((cats) => cats.find((c) => c.code === code) || Promise.reject(new Error('Not found')))
        ),
  getByDeviceTypeId: (deviceTypeId: number): Promise<DeviceCategoryResponse[]> =>
    USE_MOCKS
      ? mockApi.deviceCategories.getAll().then((cats) => cats.filter((c) => c.deviceTypeId === deviceTypeId))
      : safeApiCall(
          () => apiCall(`/api/v1/admin/device-categories/by-type/${deviceTypeId}`),
          () => mockApi.deviceCategories.getAll().then((cats) => cats.filter((c) => c.deviceTypeId === deviceTypeId))
        ),
  create: (data: DeviceCategoryRequest): Promise<DeviceCategoryResponse> =>
    USE_MOCKS
      ? Promise.resolve({ ...mockDeviceCategories[0], id: Date.now(), code: data.code, name: data.translations.en?.name || data.code, deviceTypeId: data.deviceTypeId })
      : safeApiCall(
          () => apiCall('/api/v1/admin/device-categories', {
            method: 'POST',
            body: JSON.stringify(data),
          }),
          () => Promise.resolve({ ...mockDeviceCategories[0], id: Date.now(), code: data.code, name: data.translations.en?.name || data.code, deviceTypeId: data.deviceTypeId })
        ),
  update: (id: number, data: DeviceCategoryRequest): Promise<DeviceCategoryResponse> =>
    USE_MOCKS
      ? mockApi.deviceCategories.getById(id).then((cat) => ({ ...cat, ...data, name: data.translations.en?.name || cat.name }))
      : safeApiCall(
          () => apiCall(`/api/v1/admin/device-categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
          }),
          () => mockApi.deviceCategories.getById(id).then((cat) => ({ ...cat, ...data, name: data.translations.en?.name || cat.name }))
        ),
  delete: (id: number): Promise<void> =>
    USE_MOCKS ? Promise.resolve() : safeApiCall(
      () => apiCall(`/api/v1/admin/device-categories/${id}`, { method: 'DELETE' }),
      () => Promise.resolve()
    ),
};

// Devices API (Admin: /api/v1/admin/devices — full CRUD with translations)
export const devicesApi = {
  getAll: (params?: PageRequest): Promise<PageResponse<DeviceResponse>> => {
    if (USE_MOCKS) {
      return mockApi.devices.getAll(params);
    }
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.append('page', params.page.toString());
    if (params?.size !== undefined) queryParams.append('size', params.size.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    const query = queryParams.toString();
    return safeApiCall(
      () => apiCall(`/api/v1/admin/devices${query ? `?${query}` : ''}`),
      () => mockApi.devices.getAll(params)
    );
  },
  getById: (id: number): Promise<DeviceResponse> =>
    safeApiCall(
      () => apiCall(`/api/v1/admin/devices/${id}`),
      () => mockApi.devices.getById(id)
    ),
  getByCategory: (categoryId: number, params?: PageRequest): Promise<DeviceResponse[]> =>
    USE_MOCKS
      ? mockApi.devices.getAll().then((page) => page.content.filter((d) => d.deviceCategoryId === categoryId))
      : safeApiCall(
          async () => {
            const q = new URLSearchParams();
            if (params?.page !== undefined) q.append('page', params.page.toString());
            if (params?.size !== undefined) q.append('size', (params?.size ?? 100).toString());
            if (params?.sort) q.append('sort', params.sort);
            const res = await apiCall<PageResponse<DeviceResponse>>(
              `/api/v1/admin/devices/by-category/${categoryId}${q.toString() ? `?${q.toString()}` : ''}`
            );
            return res.content ?? [];
          },
          () => mockApi.devices.getAll().then((page) => page.content.filter((d) => d.deviceCategoryId === categoryId))
        ),
  create: (data: DeviceRequest): Promise<DeviceResponse> =>
    USE_MOCKS
      ? Promise.resolve({
          ...mockDevices[0],
          id: Date.now(),
          code: data.code,
          name: data.name ?? data.code,
          deviceCategoryId: data.deviceCategoryId,
        })
      : safeApiCall(
          () => apiCall('/api/v1/admin/devices', {
            method: 'POST',
            body: JSON.stringify(data),
          }),
          () =>
            Promise.resolve({
              ...mockDevices[0],
              id: Date.now(),
              code: data.code,
              name: data.name ?? data.code,
              deviceCategoryId: data.deviceCategoryId,
            })
        ),
  update: (id: number, data: DeviceRequest): Promise<DeviceResponse> =>
    USE_MOCKS
      ? mockApi.devices.getById(id).then((device) => ({ ...device, ...data }))
      : safeApiCall(
          () => apiCall(`/api/v1/admin/devices/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
          }),
          () => mockApi.devices.getById(id).then((device) => ({ ...device, ...data }))
        ),
  delete: (id: number): Promise<void> =>
    USE_MOCKS ? Promise.resolve() : safeApiCall(
      () => apiCall(`/api/v1/admin/devices/${id}`, { method: 'DELETE' }),
      () => Promise.resolve()
    ),
};

// Device Functions API (Admin: /api/v1/admin/device-functions — full CRUD with translations)
export const deviceFunctionsApi = {
  getAll: (): Promise<DeviceFunctionResponse[]> =>
    USE_MOCKS
      ? mockApi.deviceFunctions.getAll()
      : Promise.resolve([]),
  getById: (id: number): Promise<DeviceFunctionResponse> =>
    safeApiCall(
      () => apiCall(`/api/v1/admin/device-functions/${id}`),
      () => mockApi.deviceFunctions.getById(id)
    ),
  getByDeviceId: (deviceId: number): Promise<DeviceFunctionResponse[]> =>
    safeApiCall(
      () => apiCall(`/api/v1/admin/device-functions/by-device/${deviceId}/all`),
      () => mockApi.deviceFunctions.getAll().then((funcs) => funcs.filter((f) => f.deviceId === deviceId))
    ),
  create: (data: DeviceFunctionRequest): Promise<DeviceFunctionResponse> =>
    USE_MOCKS
      ? Promise.resolve({ ...mockDeviceFunctions[0], id: Date.now(), code: data.code, name: data.translations.en?.name || data.code, deviceId: data.deviceId, functionType: data.functionType })
      : safeApiCall(
          () => apiCall('/api/v1/admin/device-functions', {
            method: 'POST',
            body: JSON.stringify(data),
          }),
          () => Promise.resolve({ ...mockDeviceFunctions[0], id: Date.now(), code: data.code, name: data.translations.en?.name || data.code, deviceId: data.deviceId, functionType: data.functionType })
        ),
  update: (id: number, data: DeviceFunctionRequest): Promise<DeviceFunctionResponse> =>
    USE_MOCKS
      ? mockApi.deviceFunctions.getById(id).then((func) => ({ ...func, ...data, name: data.translations.en?.name || func.name }))
      : safeApiCall(
          () => apiCall(`/api/v1/admin/device-functions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
          }),
          () => mockApi.deviceFunctions.getById(id).then((func) => ({ ...func, ...data, name: data.translations.en?.name || func.name }))
        ),
  delete: (id: number): Promise<void> =>
    USE_MOCKS ? Promise.resolve() : safeApiCall(
      () => apiCall(`/api/v1/admin/device-functions/${id}`, { method: 'DELETE' }),
      () => Promise.resolve()
    ),
};

// Device Function Actions API (Admin: /api/v1/admin/device-function-actions — full CRUD with translations)
export const deviceFunctionActionsApi = {
  getAll: (): Promise<DeviceFunctionActionResponse[]> =>
    USE_MOCKS
      ? mockApi.deviceFunctionActions.getAll()
      : Promise.resolve([]),
  getById: (id: number): Promise<DeviceFunctionActionResponse> =>
    safeApiCall(
      () => apiCall(`/api/v1/admin/device-function-actions/${id}`),
      () => mockApi.deviceFunctionActions.getById(id)
    ),
  getByDeviceFunctionId: (deviceFunctionId: number): Promise<DeviceFunctionActionResponse[]> =>
    safeApiCall(
      () => apiCall(`/api/v1/admin/device-function-actions/by-function/${deviceFunctionId}/all`),
      () => mockApi.deviceFunctionActions.getAll().then((actions) => actions.filter((a) => a.deviceFunctionId === deviceFunctionId))
    ),
  getByDeviceId: (deviceId: number): Promise<DeviceFunctionActionResponse[]> =>
    safeApiCall(
      () => apiCall(`/api/v1/admin/device-function-actions/by-device/${deviceId}/all`),
      () => mockApi.deviceFunctionActions.getAll()
    ),
  create: (data: DeviceFunctionActionRequest): Promise<DeviceFunctionActionResponse> =>
    USE_MOCKS
      ? Promise.resolve({ ...mockDeviceFunctionActions[0], id: Date.now(), code: data.code, name: data.translations.en?.name || data.code, deviceFunctionId: data.deviceFunctionId, actionType: data.actionType })
      : safeApiCall(
          () => apiCall('/api/v1/admin/device-function-actions', {
            method: 'POST',
            body: JSON.stringify(data),
          }),
          () => Promise.resolve({ ...mockDeviceFunctionActions[0], id: Date.now(), code: data.code, name: data.translations.en?.name || data.code, deviceFunctionId: data.deviceFunctionId, actionType: data.actionType })
        ),
  update: (id: number, data: DeviceFunctionActionRequest): Promise<DeviceFunctionActionResponse> =>
    USE_MOCKS
      ? mockApi.deviceFunctionActions.getById(id).then((action) => ({ ...action, ...data, name: data.translations.en?.name || action.name }))
      : safeApiCall(
          () => apiCall(`/api/v1/admin/device-function-actions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
          }),
          () => mockApi.deviceFunctionActions.getById(id).then((action) => ({ ...action, ...data, name: data.translations.en?.name || action.name }))
        ),
  delete: (id: number): Promise<void> =>
    USE_MOCKS ? Promise.resolve() : safeApiCall(
      () => apiCall(`/api/v1/admin/device-function-actions/${id}`, { method: 'DELETE' }),
      () => Promise.resolve()
    ),
};

// Houses API (Access Control Service)
export const housesApi = {
  getById: (id: number | string): Promise<HouseResponse> =>
    accessApiCall(`/api/v1/houses/${id}`),
  getResourcesTree: (id: number | string): Promise<HouseResourceTreeNode | HouseResourceTreeNode[]> =>
    accessApiCall(`/api/v1/houses/${id}/resources/tree`),
  getByOwner: (ownerId: string, params?: PageRequest): Promise<HouseResponse[] | PageResponse<HouseResponse>> => {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.append('page', params.page.toString());
    if (params?.size !== undefined) queryParams.append('size', params.size.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    const query = queryParams.toString();
    return accessApiCall(`/api/v1/houses/user/${ownerId}${query ? `?${query}` : ''}`);
  },
  getAllAdmin: (params?: PageRequest): Promise<HouseResponse[] | PageResponse<HouseResponse>> => {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.append('page', params.page.toString());
    if (params?.size !== undefined) queryParams.append('size', params.size.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    const query = queryParams.toString();
    return accessApiCall(`/api/v1/admin/houses${query ? `?${query}` : ''}`);
  },
  getByOwnerAdmin: (ownerId: string, params?: PageRequest): Promise<HouseResponse[] | PageResponse<HouseResponse>> => {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.append('page', params.page.toString());
    if (params?.size !== undefined) queryParams.append('size', params.size.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    const query = queryParams.toString();
    return accessApiCall(`/api/v1/admin/houses/owner/${encodeURIComponent(ownerId)}${query ? `?${query}` : ''}`);
  },
  create: (data: HouseRequest): Promise<HouseResponse> =>
    accessApiCall('/api/v1/houses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number | string, data: HouseRequest): Promise<HouseResponse> =>
    accessApiCall(`/api/v1/houses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number | string): Promise<void> =>
    accessApiCall(`/api/v1/houses/${id}`, { method: 'DELETE' }),
};

function findResourceNodeByType(
  nodes: HouseResourceTreeNode[],
  type: string
): HouseResourceTreeNode | null {
  for (const node of nodes) {
    if (node.type === type) return node;
    const children = node.children ?? [];
    const found = findResourceNodeByType(children, type);
    if (found) return found;
  }
  return null;
}

async function resolveRoomParentId(data: HouseRoomRequest): Promise<number | string> {
  if (data.parentId != null) return data.parentId;
  const tree = await housesApi.getResourcesTree(data.houseId);
  const nodes = Array.isArray(tree) ? tree : [tree];
  const houseNode = findResourceNodeByType(nodes, 'HOUSE');
  if (!houseNode) {
    throw new Error('HOUSE resource node was not found');
  }
  return houseNode.id;
}

// House Devices API — register physical device in house (microservice 3001)
export const houseDevicesApi = {
  create: (
    houseId: number | string,
    data: HouseDeviceRegistrationRequest
  ): Promise<HouseDeviceRegistrationResponse> =>
    physicalDevicesApiCall('/physical-devices', {
      method: 'POST',
      body: JSON.stringify({ houseId, ...data }),
    }),
};

/** Zigbee / интеграция с мостом (Scenario Service, порт по умолчанию 3001) */
export const zigbeeDevicesApi = {
  list: (
    params?: ListParams & {
      q?: string;
      type?: 'Coordinator' | 'Router' | 'EndDevice';
      houseId?: string;
    }
  ): Promise<ListResponse<ZigbeeDeviceListItem>> => {
    const queryParams = new URLSearchParams();
    if (params?.houseId) queryParams.append('houseId', params.houseId);
    if (params?.q) queryParams.append('q', params.q);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.page !== undefined) queryParams.append('page', String(params.page));
    if (params?.limit !== undefined) queryParams.append('limit', String(params.limit));
    const query = queryParams.toString();
    return physicalDevicesApiCall(`/zigbee/devices${query ? `?${query}` : ''}`, {
      signal: params?.signal,
    });
  },
  requestSyncFromBridge: (options?: { signal?: AbortSignal }): Promise<{
    ok: boolean;
    message?: string;
  }> =>
    physicalDevicesApiCall('/zigbee/devices:sync-from-bridge', {
      method: 'POST',
      signal: options?.signal,
    }),
  /** GET /zigbee/states — история состояний по IEEE */
  listStates: (
    params: ListParams & {
      deviceIeeeAddr: string;
      from?: string | Date;
      to?: string | Date;
    }
  ): Promise<ListResponse<ZigbeeStateWire>> => {
    const queryParams = new URLSearchParams();
    queryParams.append('deviceIeeeAddr', params.deviceIeeeAddr);
    if (params.from !== undefined) {
      queryParams.append('from', params.from instanceof Date ? params.from.toISOString() : params.from);
    }
    if (params.to !== undefined) {
      queryParams.append('to', params.to instanceof Date ? params.to.toISOString() : params.to);
    }
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
    return physicalDevicesApiCall(`/zigbee/states?${queryParams.toString()}`, {
      signal: params.signal,
    });
  },
  /** GET /zigbee/device-logs — логи приёма состояний */
  listDeviceLogs: (
    params?: ListParams & {
      deviceIeeeAddr?: string;
      physicalDeviceId?: string;
      from?: string | Date;
      to?: string | Date;
      kind?: 'state_ingest' | 'bridge_event';
      source?: 'mqtt' | 'api';
    }
  ): Promise<ListResponse<Record<string, unknown>>> => {
    const queryParams = new URLSearchParams();
    if (params?.deviceIeeeAddr) queryParams.append('deviceIeeeAddr', params.deviceIeeeAddr);
    if (params?.physicalDeviceId) queryParams.append('physicalDeviceId', params.physicalDeviceId);
    if (params?.from !== undefined) {
      queryParams.append('from', params.from instanceof Date ? params.from.toISOString() : params.from);
    }
    if (params?.to !== undefined) {
      queryParams.append('to', params.to instanceof Date ? params.to.toISOString() : params.to);
    }
    if (params?.kind) queryParams.append('kind', params.kind);
    if (params?.source) queryParams.append('source', params.source);
    if (params?.page !== undefined) queryParams.append('page', params.page.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    const query = queryParams.toString();
    return physicalDevicesApiCall(`/zigbee/device-logs${query ? `?${query}` : ''}`, {
      signal: params?.signal,
    });
  },
};

export const physicalDevicesApi = {
  getAll: (
    params?: ListParams & { houseId?: number | string; roomId?: string }
  ): Promise<ListResponse<PhysicalDeviceResponse>> => {
    const queryParams = new URLSearchParams();
    if (params?.houseId !== undefined) queryParams.append('houseId', String(params.houseId));
    if (params?.roomId) queryParams.append('roomId', params.roomId);
    if (params?.page !== undefined) queryParams.append('page', params.page.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    const query = queryParams.toString();
    return physicalDevicesApiCall(`/physical-devices${query ? `?${query}` : ''}`, {
      signal: params?.signal,
    });
  },
  getById: (id: string, options?: { signal?: AbortSignal }): Promise<PhysicalDeviceResponse> =>
    physicalDevicesApiCall(`/physical-devices/${id}`, {
      signal: options?.signal,
    }),
};

export const deviceDataApi = {
  getAll: (
    params?: ListParams & {
      deviceId?: string;
      houseId?: number | string;
      deviceTypeId?: number;
      deviceFunction?: string;
      capability?: string;
      attribute?: string;
      type?: 'FLOAT' | 'NUMBER' | 'STRING' | 'BOOLEAN';
      from?: string | Date;
      to?: string | Date;
      signal?: AbortSignal;
    }
  ): Promise<ListResponse<DeviceDataResponse>> => {
    const queryParams = new URLSearchParams();
    if (params?.deviceId) queryParams.append('deviceId', params.deviceId);
    if (params?.houseId !== undefined) queryParams.append('houseId', String(params.houseId));
    if (params?.deviceTypeId !== undefined) queryParams.append('deviceTypeId', params.deviceTypeId.toString());
    if (params?.deviceFunction) queryParams.append('deviceFunction', params.deviceFunction);
    if (params?.capability) queryParams.append('capability', params.capability);
    if (params?.attribute) queryParams.append('attribute', params.attribute);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.from) queryParams.append('from', (params.from instanceof Date ? params.from.toISOString() : params.from));
    if (params?.to) queryParams.append('to', (params.to instanceof Date ? params.to.toISOString() : params.to));
    if (params?.page !== undefined) queryParams.append('page', params.page.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    const query = queryParams.toString();
    return physicalDevicesApiCall(`/device-data${query ? `?${query}` : ''}`, {
      signal: params?.signal,
    });
  },
};

export const scenariosApi = {
  getAll: (
    params?: ListParams & {
      houseId?: number | string;
      status?: 'OFFLINE' | 'ONLINE' | 'ERROR';
      creatorId?: string;
      signal?: AbortSignal;
    }
  ): Promise<ListResponse<ScenarioResponse>> => {
    const queryParams = new URLSearchParams();
    if (params?.houseId !== undefined) queryParams.append('houseId', String(params.houseId));
    if (params?.status) queryParams.append('status', params.status);
    if (params?.creatorId) queryParams.append('creatorId', params.creatorId);
    if (params?.page !== undefined) queryParams.append('page', params.page.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    const query = queryParams.toString();
    return physicalDevicesApiCall(`/scenarios${query ? `?${query}` : ''}`, {
      signal: params?.signal,
    });
  },
  getById: (id: string, options?: { signal?: AbortSignal }): Promise<ScenarioResponse> =>
    physicalDevicesApiCall(`/scenarios/${encodeURIComponent(id)}`, { signal: options?.signal }),
  create: (dto: unknown): Promise<ScenarioResponse> =>
    physicalDevicesApiCall('/scenarios', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
  update: (id: string, dto: unknown): Promise<ScenarioResponse> =>
    physicalDevicesApiCall(`/scenarios/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),
  delete: (id: string): Promise<void> =>
    physicalDevicesApiCall(`/scenarios/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};

// House Rooms API — /api/v1/rooms (GET ?houseId=, POST, GET /:id, PATCH /:id, DELETE /:id)
export const houseRoomsApi = {
  getById: (id: number | string): Promise<HouseRoomResponse> =>
    accessApiCall(`/api/v1/house-rooms/${id}`),
  getByHouseId: (houseId: number | string): Promise<HouseRoomResponse[]> =>
    accessApiCall(`/api/v1/house-rooms/house/${houseId}`),
  create: async (data: HouseRoomRequest): Promise<HouseRoomResponse> => {
    const houseId = typeof data.houseId === 'string' && /^\d+$/.test(data.houseId) ? Number(data.houseId) : data.houseId;
    return accessApiCall('/api/v1/house-rooms', {
      method: 'POST',
      body: JSON.stringify({ houseId, name: data.name }),
    });
  },
  update: (id: number | string, data: HouseRoomRequest): Promise<HouseRoomResponse> =>
    accessApiCall(`/api/v1/house-rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ houseId: data.houseId, name: data.name }),
    }),
  delete: (id: number | string): Promise<void> =>
    accessApiCall(`/api/v1/house-rooms/${id}`, { method: 'DELETE' }),
};

// House Members API — GET /api/v1/house-members/house/{houseId}, POST/DELETE /api/v1/house-members (query params)
export const houseMembersApi = {
  getByHouseId: (houseId: number | string, params?: PageRequest): Promise<HouseMemberResponse[] | PageResponse<HouseMemberResponse>> => {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.append('page', params.page.toString());
    if (params?.size !== undefined) queryParams.append('size', params.size.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    const query = queryParams.toString();
    return accessApiCall(`/api/v1/house-members/house/${houseId}${query ? `?${query}` : ''}`);
  },
  /** Houses where user is owner or member — GET /api/v1/houses/user/{userId} */
  getHousesByUserId: (userId: string, params?: PageRequest): Promise<HouseResponse[] | PageResponse<HouseResponse>> => {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.append('page', params.page.toString());
    if (params?.size !== undefined) queryParams.append('size', params.size.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    const query = queryParams.toString();
    return accessApiCall(`/api/v1/houses/user/${userId}${query ? `?${query}` : ''}`);
  },
  /** POST /api/v1/house-members?houseId=&userId= */
  addMember: (houseId: number | string, userId: string): Promise<HouseMemberResponse> =>
    accessApiCall(
      `/api/v1/house-members?houseId=${encodeURIComponent(String(houseId))}&userId=${encodeURIComponent(userId)}`,
      { method: 'POST' }
    ),
  /** DELETE /api/v1/house-members?houseId=&userId= (backend uses userId, not memberId) */
  removeMember: (houseId: number | string, memberIdOrUserId: number | string): Promise<void> =>
    accessApiCall(
      `/api/v1/house-members?houseId=${encodeURIComponent(String(houseId))}&userId=${encodeURIComponent(String(memberIdOrUserId))}`,
      { method: 'DELETE' }
    ),
};

/** Роли дома — GET /api/v1/houses/:houseId/roles */
export const houseRolesApi = {
  /**
   * Получить роли дома (GET /houses/:houseId/roles).
   * Ответ преобразуется в массив HouseRoleResponse.
   * При ошибке сети или 4xx/5xx выбрасывается ApiError.
   */
  getHouseRoles: async (houseId: number | string): Promise<HouseRoleResponse[]> => {
    const mapRoles = (data: unknown): HouseRoleResponse[] => {
      if (!Array.isArray(data)) return [];
      return data.map((item: unknown) => {
        const o = item as Record<string, unknown>;
        const rawRoleId = typeof o.id === 'string' ? o.id : typeof o.roleId === 'string' ? o.roleId : '';
        return {
          id: rawRoleId || String(o.id ?? o.roleId ?? ''),
          name: typeof o.name === 'string' ? o.name : undefined,
          code: typeof o.code === 'string' ? o.code : undefined,
          priority: typeof o.priority === 'number' ? o.priority : undefined,
          memberCount:
            typeof o.memberCount === 'number'
              ? o.memberCount
              : typeof o.usersCount === 'number'
                ? o.usersCount
                : undefined,
          system: o.system === true || o.isSystem === true,
          permissions: Array.isArray(o.permissions)
            ? o.permissions.filter((p): p is string => typeof p === 'string')
            : undefined,
        } as HouseRoleResponse;
      });
    };

    try {
      const data = await accessApiCall<unknown>(`/api/v1/house-roles/house/${encodeURIComponent(String(houseId))}`);
      return mapRoles(data);
    } catch {
      const fallback = await accessApiCall<unknown>(`/api/v1/houses/${houseId}/roles`);
      return mapRoles(fallback);
    }
  },

  /** @deprecated Use getHouseRoles instead */
  getByHouseId: (houseId: number | string): Promise<HouseRoleResponse[]> =>
    houseRolesApi.getHouseRoles(houseId),

  /**
   * Создать роль дома (POST /api/v1/houses/{houseId}/roles).
   * Тело: { name, priority? }.
   */
  createRole: (
    houseId: number | string,
    data: HouseRoleCreateRequest
  ): Promise<HouseRoleResponse> =>
    accessApiCall(`/api/v1/house-roles/house/${encodeURIComponent(String(houseId))}`, {
      method: 'POST',
      body: JSON.stringify({
        name: data.name.trim(),
        priority: data.priority ?? 0,
      }),
    }).then((res: unknown) => {
      const o = res as Record<string, unknown>;
      return {
        id: typeof o.id === 'string' ? o.id : String(o.id ?? ''),
        name: typeof o.name === 'string' ? o.name : undefined,
        code: typeof o.code === 'string' ? o.code : undefined,
        priority: typeof o.priority === 'number' ? o.priority : undefined,
        memberCount:
          typeof o.memberCount === 'number'
            ? o.memberCount
            : typeof o.usersCount === 'number'
              ? o.usersCount
              : undefined,
        system: o.system === true,
        permissions: Array.isArray(o.permissions)
          ? o.permissions.filter((p): p is string => typeof p === 'string')
          : undefined,
      } as HouseRoleResponse;
    }),

  /**
   * Обновить роль дома (PATCH /api/v1/house-roles/{id}).
   * Тело: { name?, priority? }.
   */
  updateRole: (
    roleId: number | string,
    data: HouseRoleCreateRequest
  ): Promise<HouseRoleResponse> =>
    accessApiCall(`/api/v1/house-roles/${roleId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: data.name.trim(),
        ...(data.priority !== undefined && { priority: data.priority }),
      }),
    }).then((res: unknown) => {
      const o = res as Record<string, unknown>;
      return {
        id: typeof o.id === 'string' ? o.id : String(o.id ?? ''),
        name: typeof o.name === 'string' ? o.name : undefined,
        code: typeof o.code === 'string' ? o.code : undefined,
        priority: typeof o.priority === 'number' ? o.priority : undefined,
        memberCount:
          typeof o.memberCount === 'number'
            ? o.memberCount
            : typeof o.usersCount === 'number'
              ? o.usersCount
              : undefined,
        system: o.system === true,
        permissions: Array.isArray(o.permissions)
          ? o.permissions.filter((p): p is string => typeof p === 'string')
          : undefined,
      } as HouseRoleResponse;
    }),

  /**
   * Удалить роль дома (DELETE /api/v1/house-roles/{id}).
   * Системные роли удалить нельзя (бэкенд вернёт ошибку).
   */
  deleteRole: (roleId: number | string): Promise<void> =>
    accessApiCall(`/api/v1/house-roles/${roleId}`, {
      method: 'DELETE',
    }),

  /**
   * Получить пользователей роли (GET /api/v1/house-roles/{id}/members).
   */
  getRoleMembers: (roleId: number | string): Promise<RoleMemberResponse[]> =>
    accessApiCall(`/api/v1/house-roles/${roleId}/members`).then((data: unknown) => {
      if (!Array.isArray(data)) return [];
      return data.map((item: unknown) => {
        const o = item as Record<string, unknown>;
        return {
          id: o.id ?? o.userId ?? '',
          userId: typeof o.userId === 'string' ? o.userId : undefined,
          name: typeof o.name === 'string' ? o.name : undefined,
          email: typeof o.email === 'string' ? o.email : undefined,
          avatarUrl:
            typeof o.avatarUrl === 'string'
              ? o.avatarUrl
              : typeof o.userAvatarUrl === 'string'
                ? o.userAvatarUrl
                : undefined,
        } as RoleMemberResponse;
      });
    }),

  /** Получить политики дома (GET /api/v1/houses/{houseId}/policies). */
  getHousePolicies: (houseId: number | string): Promise<HousePolicyResponse[]> =>
    accessApiCall(`/api/v1/houses/${encodeURIComponent(String(houseId))}/policies`).then((data: unknown) => {
      if (!Array.isArray(data)) return [];
      return data.map((item: unknown) => {
        const o = item as Record<string, unknown>;
        return {
          id: typeof o.id === 'string' ? o.id : String(o.id ?? ''),
          name: typeof o.name === 'string' ? o.name : undefined,
          effect: typeof o.effect === 'string' ? o.effect : undefined,
          subjectType: typeof o.subjectType === 'string' ? o.subjectType : undefined,
          subjectId: typeof o.subjectId === 'string' ? o.subjectId : undefined,
          resourceId: typeof o.resourceId === 'string' ? o.resourceId : undefined,
          priority: typeof o.priority === 'number' ? o.priority : undefined,
          condition:
            o.condition && typeof o.condition === 'object'
              ? (o.condition as Record<string, unknown>)
              : undefined,
        } as HousePolicyResponse;
      });
    }),

  /** Создать политику дома (POST /api/v1/policies). */
  createPolicy: (body: CreatePolicyRequestDto): Promise<HousePolicyResponse> =>
    accessApiCall('/api/v1/policies', {
      method: 'POST',
      body: JSON.stringify(body),
    }).then((res: unknown) => {
      const o = res as Record<string, unknown>;
      return {
        id: typeof o.id === 'string' ? o.id : String(o.id ?? ''),
        name: typeof o.name === 'string' ? o.name : undefined,
        effect: typeof o.effect === 'string' ? o.effect : undefined,
        subjectType: typeof o.subjectType === 'string' ? o.subjectType : undefined,
        subjectId: typeof o.subjectId === 'string' ? o.subjectId : undefined,
        resourceId: typeof o.resourceId === 'string' ? o.resourceId : undefined,
        priority: typeof o.priority === 'number' ? o.priority : undefined,
        condition:
          o.condition && typeof o.condition === 'object'
            ? (o.condition as Record<string, unknown>)
            : undefined,
      } as HousePolicyResponse;
    }),

  /** Создать ресурс в дереве дома (POST /api/v1/resources). */
  createResource: (body: CreateResourceRequestDto): Promise<ResourceResponseDto> =>
    accessApiCall('/api/v1/resources', {
      method: 'POST',
      body: JSON.stringify(body),
    }).then((res: unknown) => {
      const o = res as Record<string, unknown>;
      return {
        id: typeof o.id === 'string' ? o.id : String(o.id ?? ''),
        type: typeof o.type === 'string' ? o.type : undefined,
        parentId: typeof o.parentId === 'string' ? o.parentId : undefined,
        name: typeof o.name === 'string' ? o.name : undefined,
        externalId: typeof o.externalId === 'string' ? o.externalId : undefined,
      } as ResourceResponseDto;
    }),

  /**
   * Назначить роль участнику (POST /api/v1/house-roles/members/{memberId}/roles/{roleId}).
   */
  assignRoleToMember: (
    memberId: number | string,
    roleId: string
  ): Promise<unknown> =>
    accessApiCall(`/api/v1/house-roles/members/${memberId}/roles/${roleId}`, {
      method: 'POST',
    }),

  /**
   * Снять роль с участника (DELETE /api/v1/house-roles/members/{memberId}/roles/{roleId}).
   */
  removeRoleFromMember: (
    memberId: number | string,
    roleId: string
  ): Promise<void> =>
    accessApiCall(`/api/v1/house-roles/members/${memberId}/roles/${roleId}`, {
      method: 'DELETE',
    }),

  /**
   * Получить разрешения роли (GET /api/v1/roles/{id}/permissions).
   */
  getRolePermissions: (roleId: string): Promise<unknown> =>
    accessApiCall(`/api/v1/roles/${roleId}/permissions`),

  /**
   * Добавить разрешение роли (POST /api/v1/roles/{id}/permissions).
   */
  addRolePermission: (roleId: string, body: Record<string, unknown>): Promise<unknown> =>
    accessApiCall(`/api/v1/roles/${roleId}/permissions`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  /**
   * Удалить разрешение у роли (DELETE /api/v1/roles/{id}/permissions).
   * Тело или query с идентификатором разрешения — уточнить по контракту бэкенда.
   */
  deleteRolePermission: (roleId: string, permissionId?: string): Promise<void> =>
    accessApiCall(
      `/api/v1/roles/${roleId}/permissions${permissionId ? `?permissionId=${encodeURIComponent(permissionId)}` : ''}`,
      { method: 'DELETE' }
    ),
};

// Invitations API — GET/POST /api/v1/house-invitations, GET .../house/{houseId}, POST .../{token}/accept, POST .../{id}/revoke
export const houseInvitationsApi = {
  /** Получить приглашение по токену — GET /api/v1/house-invitations/token/{token} */
  getByToken: (token: string): Promise<HouseInvitationResponse> =>
    accessApiCall(`/api/v1/house-invitations/token/${encodeURIComponent(token)}`),
  /** Список приглашений дома — GET /api/v1/house-invitations/house/{houseId} */
  getByHouseId: (houseId: number | string, params?: PageRequest): Promise<HouseInvitationResponse[] | PageResponse<HouseInvitationResponse>> => {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.append('page', params.page.toString());
    if (params?.size !== undefined) queryParams.append('size', params.size.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    const query = queryParams.toString();
    return accessApiCall(`/api/v1/house-invitations/house/${houseId}${query ? `?${query}` : ''}`);
  },
  /** Создать приглашение — POST /api/v1/house-invitations */
  create: (houseId: number | string, data: HouseInvitationRequest, userId: string): Promise<HouseInvitationResponse> =>
    accessApiCall('/api/v1/house-invitations', {
      method: 'POST',
      headers: { 'X-User-Id': userId },
      body: JSON.stringify({
        houseId: typeof houseId === 'string' && /^\d+$/.test(houseId) ? Number(houseId) : houseId,
        email: data.email,
        ...(data.roleId ? { roleId: data.roleId } : {}),
        ...(data.permissions?.length ? { permissions: data.permissions } : {}),
        ...(data.accessRight ? { accessRight: data.accessRight } : {}),
        ...(data.expiresAt ? { expiresAt: data.expiresAt } : {}),
      }),
    }),
  /** Принять приглашение — POST /api/v1/house-invitations/{token}/accept */
  accept: (token: string, userId: string): Promise<HouseInvitationResponse> =>
    accessApiCall(`/api/v1/house-invitations/${encodeURIComponent(token)}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
      body: JSON.stringify({ token, userId }),
    }),
  /** Отозвать приглашение — POST /api/v1/house-invitations/{id}/revoke */
  revoke: (id: number | string, userId: string): Promise<void> =>
    accessApiCall(`/api/v1/house-invitations/${id}/revoke`, {
      method: 'POST',
      headers: { 'X-User-Id': userId },
    }),
};

/**
 * Доменные права (Access Control) — POST/PUT/DELETE /api/v1/access-control/rights, GET …/member/{id}, …/house/{id}.
 * См. `docs-json` (тег Access Control).
 */
export function mapCreateAccessRightToHouseDomain(dto: CreateAccessRightDto): HouseAccessRightRequestDto {
  return {
    resourceId: dto.resourceId,
    ...(dto.houseMemberId ? { houseMemberId: dto.houseMemberId } : {}),
    ...(dto.roleId ? { houseRoleId: dto.roleId } : {}),
    accessRightType: dto.accessRightType,
    ...(dto.expiresAt ? { expiresAt: dto.expiresAt } : {}),
  };
}

function accessControlRightsQueryString(params?: PageRequest): string {
  const q = new URLSearchParams();
  if (params?.page !== undefined) q.append('page', params.page.toString());
  if (params?.size !== undefined) q.append('size', params.size.toString());
  if (params?.sort) q.append('sort', params.sort);
  return q.toString();
}

/** GET /api/v1/access-control/rights/member/{memberId} — именованный export: устойчив к частичному HMR объекта accessRightsApi. */
export async function fetchAccessControlRightsByMember(
  memberId: string,
  params?: PageRequest
): Promise<HouseAccessRightResponse[] | PageResponse<HouseAccessRightResponse>> {
  const qs = accessControlRightsQueryString(params);
  return accessApiCall(
    `/api/v1/access-control/rights/member/${encodeURIComponent(memberId)}${qs ? `?${qs}` : ''}`
  );
}

/** GET /api/v1/access-control/rights/house/{houseId} */
export async function fetchAccessControlRightsByHouse(
  houseId: string,
  params?: PageRequest
): Promise<HouseAccessRightResponse[] | PageResponse<HouseAccessRightResponse>> {
  const qs = accessControlRightsQueryString(params);
  return accessApiCall(
    `/api/v1/access-control/rights/house/${encodeURIComponent(houseId)}${qs ? `?${qs}` : ''}`
  );
}

/** RBAC: ленивый import — избегает «getByUser is not a function» при частичном HMR api-client. */
export function fetchRbacAccessRightsByUser(userId: string): Promise<AccessRightResponse[]> {
  return import('./rbac-access-rights').then((m) => m.fetchRbacAccessRightsByUser(userId));
}

export function deleteRbacAccessRight(id: number | string): Promise<void> {
  return import('./rbac-access-rights').then((m) => m.deleteRbacAccessRight(id));
}

export function fetchRbacAccessRightsByResource(
  resourceId: number | string
): Promise<AccessRightResponse[]> {
  return import('./rbac-access-rights').then((m) => m.fetchRbacAccessRightsByResource(resourceId));
}

export const accessControlRightsApi = {
  create: (dto: HouseAccessRightRequestDto): Promise<HouseAccessRightResponse> =>
    accessApiCall('/api/v1/access-control/rights', { method: 'POST', body: JSON.stringify(dto) }),

  update: (id: string, dto: HouseAccessRightRequestDto): Promise<HouseAccessRightResponse> =>
    accessApiCall(`/api/v1/access-control/rights/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    }),

  delete: (id: number | string): Promise<void> =>
    accessApiCall(`/api/v1/access-control/rights/${encodeURIComponent(String(id))}`, { method: 'DELETE' }),

  getByMember: fetchAccessControlRightsByMember,

  getByHouse: fetchAccessControlRightsByHouse,

  checkAccess: (dto: AccessControlCheckRequestDto): Promise<AccessCheckResponse> =>
    accessApiCall('/api/v1/access-control/check', { method: 'POST', body: JSON.stringify(dto) }),

  cleanupExpired: (): Promise<void> =>
    accessApiCall('/api/v1/access-control/cleanup/expired', { method: 'POST' }),
};

// Access Rights API (RBAC — тег Access Rights в docs-json)
export const accessRightsApi = {
  /** POST /api/v1/access-rights */
  create: (dto: CreateAccessRightDto): Promise<AccessRightResponse> =>
    accessApiCall('/api/v1/access-rights', { method: 'POST', body: JSON.stringify(dto) }),

  /** DELETE /api/v1/access-rights/{id} */
  delete: (id: number | string): Promise<void> =>
    import('./rbac-access-rights').then((m) => m.deleteRbacAccessRight(id)),

  getByUser: (userId: string): Promise<AccessRightResponse[]> =>
    import('./rbac-access-rights').then((m) => m.fetchRbacAccessRightsByUser(userId)),

  getByResource: (resourceId: number | string): Promise<AccessRightResponse[]> =>
    import('./rbac-access-rights').then((m) => m.fetchRbacAccessRightsByResource(resourceId)),

  /** POST /api/v1/permissions/rebuild */
  rebuildCache: (): Promise<void> =>
    accessApiCall('/api/v1/permissions/rebuild', { method: 'POST' }),

  /** GET /api/v1/access-structure?userId= */
  getAccessStructure: (userId: string): Promise<AccessStructureResponse> =>
    accessApiCall(`/api/v1/access-structure?userId=${encodeURIComponent(userId)}`),
};
