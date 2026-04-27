'use client';

import type {
  HouseDeviceRegistrationRequest,
  HouseDeviceRegistrationResponse,
  PhysicalDeviceResponse,
  DeviceDataResponse,
  ZigbeeDeviceListItem,
  ZigbeeStateWire,
  ScenarioResponse,
  ListResponse,
} from '@/types/api';
import { physicalDevicesApiCall } from './core';

type ListParams = { page?: number; limit?: number; signal?: AbortSignal };

export const houseDevicesApi = {
  create: (
    houseId: number | string,
    data: HouseDeviceRegistrationRequest,
  ): Promise<HouseDeviceRegistrationResponse> =>
    physicalDevicesApiCall('/physical-devices', {
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
    return physicalDevicesApiCall(`/zigbee/devices${query ? `?${query}` : ''}`, {
      signal: params?.signal,
    });
  },

  requestSyncFromBridge: (options?: { signal?: AbortSignal }): Promise<{ ok: boolean; message?: string }> =>
    physicalDevicesApiCall('/zigbee/devices:sync-from-bridge', {
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
    return physicalDevicesApiCall(`/zigbee/states?${q.toString()}`, { signal: params.signal });
  },

  sendCommand: (
    ieeeAddr: string,
    payload: Record<string, unknown>,
  ): Promise<{ ok: true; topic: string }> =>
    physicalDevicesApiCall(`/api/v1/zigbee/devices/${encodeURIComponent(ieeeAddr)}/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload }),
    }),

  remove: (ieeeAddr: string, force = false): Promise<{ ok: boolean; deleted?: unknown }> =>
    physicalDevicesApiCall(
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
    return physicalDevicesApiCall(`/zigbee/device-logs${query ? `?${query}` : ''}`, {
      signal: params?.signal,
    });
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
    return physicalDevicesApiCall(`/physical-devices${query ? `?${query}` : ''}`, {
      signal: params?.signal,
    });
  },

  getById: (id: string, options?: { signal?: AbortSignal }): Promise<PhysicalDeviceResponse> =>
    physicalDevicesApiCall(`/physical-devices/${id}`, { signal: options?.signal }),

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
    physicalDevicesApiCall(`/physical-devices/${id}`, {
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
    },
  ): Promise<ListResponse<ScenarioResponse>> => {
    const q = new URLSearchParams();
    if (params?.houseId !== undefined) q.append('houseId', String(params.houseId));
    if (params?.status) q.append('status', params.status);
    if (params?.creatorId) q.append('creatorId', params.creatorId);
    if (params?.page !== undefined) q.append('page', params.page.toString());
    if (params?.limit !== undefined) q.append('limit', params.limit.toString());
    const query = q.toString();
    return physicalDevicesApiCall(`/scenarios${query ? `?${query}` : ''}`, {
      signal: params?.signal,
    });
  },

  getById: (id: string, options?: { signal?: AbortSignal }): Promise<ScenarioResponse> =>
    physicalDevicesApiCall(`/scenarios/${encodeURIComponent(id)}`, { signal: options?.signal }),

  create: (dto: unknown): Promise<ScenarioResponse> =>
    physicalDevicesApiCall('/scenarios', { method: 'POST', body: JSON.stringify(dto) }),

  update: (id: string, dto: unknown): Promise<ScenarioResponse> =>
    physicalDevicesApiCall(`/scenarios/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  delete: (id: string): Promise<void> =>
    physicalDevicesApiCall(`/scenarios/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
