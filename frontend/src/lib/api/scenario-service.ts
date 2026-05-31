'use client';

import type {
  HouseDeviceRegistrationRequest,
  HouseDeviceRegistrationResponse,
  HouseMqttConfigResponse,
  HouseMqttConfigUpsertRequest,
  PhysicalDeviceResponse,
  DeviceDataResponse,
  ZigbeeDeviceListItem,
  ZigbeeStateWire,
  ScenarioResponse,
  ListResponse,
} from '@/types/api';
import { physicalDevicesApiCall } from './core';
import type { ApiCallOptions } from './core';

type ListParams = { page?: number; limit?: number; signal?: AbortSignal };

const scenarioApi = <T>(path: string, options?: ApiCallOptions) =>
  physicalDevicesApiCall<T>(`/v1${path}`, options);

export const houseDevicesApi = {
  create: (
    houseId: number | string,
    data: HouseDeviceRegistrationRequest,
  ): Promise<HouseDeviceRegistrationResponse> =>
    scenarioApi('/physical-devices', {
      method: 'POST',
      body: JSON.stringify({ houseId, ...data }),
    }),
};

export const zigbeeDevicesApi = {
  list: (
    params?: ListParams & {
      q?: string;
      type?: 'Coordinator' | 'Router' | 'EndDevice';
      houseId?: string;
    },
  ): Promise<ListResponse<ZigbeeDeviceListItem>> => {
    const q = new URLSearchParams();
    if (params?.houseId) q.append('houseId', params.houseId);
    if (params?.q) q.append('q', params.q);
    if (params?.type) q.append('type', params.type);
    if (params?.page !== undefined) q.append('page', String(params.page));
    if (params?.limit !== undefined) q.append('limit', String(params.limit));
    const query = q.toString();
    return scenarioApi(`/zigbee/devices${query ? `?${query}` : ''}`, {
      signal: params?.signal,
    });
  },

  requestSyncFromBridge: (
    houseId: string,
    options?: { signal?: AbortSignal },
  ): Promise<{ ok: boolean; message?: string }> =>
    scenarioApi(`/zigbee/devices:sync-from-bridge?houseId=${encodeURIComponent(houseId)}`, {
      method: 'POST',
      signal: options?.signal,
    }),

  listStates: (
    params: ListParams & {
      deviceIeeeAddr: string;
      from?: string | Date;
      to?: string | Date;
    },
  ): Promise<ListResponse<ZigbeeStateWire>> => {
    const q = new URLSearchParams();
    q.append('deviceIeeeAddr', params.deviceIeeeAddr);
    if (params.from !== undefined)
      q.append('from', params.from instanceof Date ? params.from.toISOString() : params.from);
    if (params.to !== undefined)
      q.append('to', params.to instanceof Date ? params.to.toISOString() : params.to);
    if (params.page !== undefined) q.append('page', params.page.toString());
    if (params.limit !== undefined) q.append('limit', params.limit.toString());
    return scenarioApi(`/zigbee/states?${q.toString()}`, { signal: params.signal });
  },

  sendCommand: (
    ieeeAddr: string,
    payload: Record<string, unknown>,
  ): Promise<{ ok: true; topic: string }> =>
    scenarioApi(`/zigbee/devices/${encodeURIComponent(ieeeAddr)}/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload }),
    }),

  remove: (ieeeAddr: string, force = false): Promise<{ ok: boolean; deleted?: unknown }> =>
    scenarioApi(
      `/zigbee/devices/${encodeURIComponent(ieeeAddr)}${force ? '?force=true' : ''}`,
      { method: 'DELETE' },
    ),

  listDeviceLogs: (
    params?: ListParams & {
      deviceIeeeAddr?: string;
      physicalDeviceId?: string;
      from?: string | Date;
      to?: string | Date;
      kind?: 'state_ingest' | 'bridge_event';
      source?: 'mqtt' | 'api';
    },
  ): Promise<ListResponse<Record<string, unknown>>> => {
    const q = new URLSearchParams();
    if (params?.deviceIeeeAddr) q.append('deviceIeeeAddr', params.deviceIeeeAddr);
    if (params?.physicalDeviceId) q.append('physicalDeviceId', params.physicalDeviceId);
    if (params?.from !== undefined)
      q.append('from', params.from instanceof Date ? params.from.toISOString() : params.from);
    if (params?.to !== undefined)
      q.append('to', params.to instanceof Date ? params.to.toISOString() : params.to);
    if (params?.kind) q.append('kind', params.kind);
    if (params?.source) q.append('source', params.source);
    if (params?.page !== undefined) q.append('page', params.page.toString());
    if (params?.limit !== undefined) q.append('limit', params.limit.toString());
    const query = q.toString();
    return scenarioApi(`/zigbee/device-logs${query ? `?${query}` : ''}`, {
      signal: params?.signal,
    });
  },
};

export const houseMqttApi = {
  /** Get MQTT config for a house (without password). */
  get: (houseId: string, options?: { signal?: AbortSignal }): Promise<HouseMqttConfigResponse> =>
    scenarioApi(`/zigbee/house-mqtt/${encodeURIComponent(houseId)}`, {
      signal: options?.signal,
    }),

  /** Upsert MQTT config and reconnect/disconnect accordingly. */
  upsert: (
    houseId: string,
    dto: HouseMqttConfigUpsertRequest,
    options?: { signal?: AbortSignal },
  ): Promise<HouseMqttConfigResponse> =>
    scenarioApi(`/zigbee/house-mqtt/${encodeURIComponent(houseId)}`, {
      method: 'PUT',
      signal: options?.signal,
      body: JSON.stringify(dto),
    }),

  delete: (houseId: string, options?: { signal?: AbortSignal }): Promise<{ ok: true; houseId: string }> =>
    scenarioApi(`/zigbee/house-mqtt/${encodeURIComponent(houseId)}`, {
      method: 'DELETE',
      signal: options?.signal,
    }),

  reconnect: (houseId: string, options?: { signal?: AbortSignal }): Promise<{ ok: true; houseId: string }> =>
    scenarioApi(`/zigbee/house-mqtt/${encodeURIComponent(houseId)}/reconnect`, {
      method: 'POST',
      signal: options?.signal,
    }),
};

export const dashboardApi = {
  getOverview: (params: {
    houseIds: Array<string | number>;
    from?: string | Date;
    limit?: number;
    signal?: AbortSignal;
  }): Promise<{
    totalDevices: number;
    totalActiveScenarios: number;
    eventsCount: number;
    recentEvents: Array<{
      id: string;
      timestamp: string;
      houseId: string;
      deviceName: string;
      action: string;
      result: 'SUCCESS' | 'DENIED' | 'ERROR';
    }>;
  }> => {
    const q = new URLSearchParams();
    for (const id of params.houseIds) q.append('houseId', String(id));
    if (params.from !== undefined) {
      q.append('from', params.from instanceof Date ? params.from.toISOString() : String(params.from));
    }
    if (params.limit !== undefined) q.append('limit', String(params.limit));
    return scenarioApi(`/dashboard/overview?${q.toString()}`, { signal: params.signal });
  },
};

export const physicalDevicesApi = {
  getAll: (
    params?: ListParams & { houseId?: number | string; roomId?: string },
  ): Promise<ListResponse<PhysicalDeviceResponse>> => {
    const q = new URLSearchParams();
    if (params?.houseId !== undefined) q.append('houseId', String(params.houseId));
    if (params?.roomId) q.append('roomId', params.roomId);
    if (params?.page !== undefined) q.append('page', params.page.toString());
    if (params?.limit !== undefined) q.append('limit', params.limit.toString());
    const query = q.toString();
    return scenarioApi(`/physical-devices${query ? `?${query}` : ''}`, {
      signal: params?.signal,
    });
  },

  getById: (id: string, options?: { signal?: AbortSignal }): Promise<PhysicalDeviceResponse> =>
    scenarioApi(`/physical-devices/${id}`, { signal: options?.signal }),

  update: (
    id: string,
    data: {
      houseId?: string;
      name?: string;
      roomId?: string | null;
      description?: string | null;
      deviceCategoryId?: number | null;
      deviceTypeId?: number | null;
      deviceId?: number | null;
      firmwareVersion?: string | null;
      ipAddress?: string | null;
      macAddress?: string | null;
      serialNumber?: string | null;
    },
  ): Promise<PhysicalDeviceResponse> =>
    scenarioApi(`/physical-devices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
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
    },
  ): Promise<ListResponse<DeviceDataResponse>> => {
    const q = new URLSearchParams();
    if (params?.deviceId) q.append('deviceId', params.deviceId);
    if (params?.houseId !== undefined) q.append('houseId', String(params.houseId));
    if (params?.deviceTypeId !== undefined) q.append('deviceTypeId', params.deviceTypeId.toString());
    if (params?.deviceFunction) q.append('deviceFunction', params.deviceFunction);
    if (params?.capability) q.append('capability', params.capability);
    if (params?.attribute) q.append('attribute', params.attribute);
    if (params?.type) q.append('type', params.type);
    if (params?.from)
      q.append('from', params.from instanceof Date ? params.from.toISOString() : params.from);
    if (params?.to)
      q.append('to', params.to instanceof Date ? params.to.toISOString() : params.to);
    if (params?.page !== undefined) q.append('page', params.page.toString());
    if (params?.limit !== undefined) q.append('limit', params.limit.toString());
    const query = q.toString();
    return scenarioApi(`/device-data${query ? `?${query}` : ''}`, {
      signal: params?.signal,
    });
  },

  getSeries: (params: {
    deviceId: string;
    range: import('@/types/api').DeviceDataSeriesRange;
    capabilities?: string[];
    to?: string | Date;
    signal?: AbortSignal;
  }): Promise<import('@/types/api').DeviceDataSeriesResponse> => {
    const q = new URLSearchParams();
    q.append('deviceId', params.deviceId);
    q.append('range', params.range);
    if (params.capabilities && params.capabilities.length > 0) {
      q.append('capabilities', params.capabilities.join(','));
    }
    if (params.to) q.append('to', params.to instanceof Date ? params.to.toISOString() : params.to);
    return scenarioApi(`/device-data/series?${q.toString()}`, { signal: params.signal });
  },
};

export const widgetDashboardsApi = {
  getByHouse: (houseId: string): Promise<import('@/features/widget-dashboard/types/widget.types').WidgetDashboard[]> =>
    scenarioApi(`/widget-dashboards?houseId=${encodeURIComponent(houseId)}`),

  getById: (id: string): Promise<import('@/features/widget-dashboard/types/widget.types').WidgetDashboard> =>
    scenarioApi(`/widget-dashboards/${id}`),

  create: (dto: {
    houseId: string;
    name: string;
    isDefault?: boolean;
  }): Promise<import('@/features/widget-dashboard/types/widget.types').WidgetDashboard> =>
    scenarioApi('/widget-dashboards', { method: 'POST', body: JSON.stringify(dto) }),

  update: (
    id: string,
    dto: {
      name?: string;
      isDefault?: boolean;
      layouts?: Record<string, unknown>;
      widgets?: unknown[];
    },
  ): Promise<import('@/features/widget-dashboard/types/widget.types').WidgetDashboard> =>
    scenarioApi(`/widget-dashboards/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),

  updateLayout: (
    id: string,
    layouts: Record<string, unknown>,
  ): Promise<import('@/features/widget-dashboard/types/widget.types').WidgetDashboard> =>
    scenarioApi(`/widget-dashboards/${id}/layout`, {
      method: 'PATCH',
      body: JSON.stringify({ layouts }),
    }),

  delete: (id: string): Promise<void> =>
    scenarioApi(`/widget-dashboards/${id}`, { method: 'DELETE' }),
};

export const scenariosApi = {
  getAll: (
    params?: ListParams & {
      houseId?: number | string;
      status?: 'OFFLINE' | 'ONLINE' | 'ERROR';
      creatorId?: string;
    },
  ): Promise<ListResponse<ScenarioResponse>> => {
    const q = new URLSearchParams();
    if (params?.houseId !== undefined) q.append('houseId', String(params.houseId));
    if (params?.status) q.append('status', params.status);
    if (params?.creatorId) q.append('creatorId', params.creatorId);
    if (params?.page !== undefined) q.append('page', params.page.toString());
    if (params?.limit !== undefined) q.append('limit', params.limit.toString());
    const query = q.toString();
    return scenarioApi(`/scenarios${query ? `?${query}` : ''}`, {
      signal: params?.signal,
    });
  },

  getById: (id: string, options?: { signal?: AbortSignal }): Promise<ScenarioResponse> =>
    scenarioApi(`/scenarios/${encodeURIComponent(id)}`, { signal: options?.signal }),

  create: (dto: unknown): Promise<ScenarioResponse> =>
    scenarioApi('/scenarios', { method: 'POST', body: JSON.stringify(dto) }),

  update: (id: string, dto: unknown): Promise<ScenarioResponse> =>
    scenarioApi(`/scenarios/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  delete: (id: string): Promise<void> =>
    scenarioApi(`/scenarios/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
