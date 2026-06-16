'use client';

import type {
  ModbusDeviceResponse,
  ModbusRegisterResponse,
  ModbusRegisterStateResponse,
  CreateModbusDeviceRequest,
  CreateModbusRegisterRequest,
  WriteModbusRegisterRequest,
} from '@/types/api';
import { physicalDevicesApiCall } from './core';

const base = (path: string) => physicalDevicesApiCall<any>(`/v1/modbus${path}`);

export const modbusApi = {
  listDevices: (params?: { houseId?: string }): Promise<ModbusDeviceResponse[]> => {
    const q = params?.houseId
      ? `?houseId=${encodeURIComponent(params.houseId)}`
      : '';
    return base(`/devices${q}`);
  },

  getDevice: (id: string): Promise<ModbusDeviceResponse> =>
    base(`/devices/${id}`),

  createDevice: (body: CreateModbusDeviceRequest): Promise<ModbusDeviceResponse> =>
    physicalDevicesApiCall('/v1/modbus/devices', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  deleteDevice: (id: string): Promise<void> =>
    physicalDevicesApiCall(`/v1/modbus/devices/${id}`, { method: 'DELETE' }),

  listRegisters: (deviceId: string): Promise<ModbusRegisterResponse[]> =>
    base(`/devices/${deviceId}/registers`),

  createRegister: (deviceId: string, body: CreateModbusRegisterRequest): Promise<ModbusRegisterResponse> =>
    physicalDevicesApiCall(`/v1/modbus/devices/${deviceId}/registers`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  deleteRegister: (deviceId: string, registerId: string): Promise<void> =>
    physicalDevicesApiCall(`/v1/modbus/devices/${deviceId}/registers/${registerId}`, {
      method: 'DELETE',
    }),

  readRegister: (deviceId: string, registerId: string): Promise<ModbusRegisterStateResponse> =>
    physicalDevicesApiCall(`/v1/modbus/devices/${deviceId}/registers/${registerId}/read`, {
      method: 'POST',
    }),

  writeRegister: (
    deviceId: string,
    registerId: string,
    body: WriteModbusRegisterRequest,
  ): Promise<void> =>
    physicalDevicesApiCall(
      `/v1/modbus/devices/${deviceId}/registers/${registerId}/write`,
      { method: 'POST', body: JSON.stringify(body) },
    ),

  getDeviceStates: (deviceId: string): Promise<ModbusRegisterStateResponse[]> =>
    base(`/devices/${deviceId}/state`),
};
