import type { ZigbeeDeviceListItem, ZigbeeStateWire } from '@/types/api';

/** MongoDB ObjectId as string (24 hex), matches backend zigbeeSocketSubscribeSchema */
export const MONGO_OBJECT_ID_RE = /^[a-f0-9]{24}$/i;

export function zigbeeAddress(device: ZigbeeDeviceListItem): string {
  return device.ieeeAddr ?? device.protocolAddress ?? device.id;
}

export function zigbeeDisplayName(device: ZigbeeDeviceListItem): string {
  const raw = device.friendlyName || device.name || zigbeeAddress(device);
  return typeof raw === 'string' ? raw.trim() : String(raw);
}

export function isZigbeeDevice(device: ZigbeeDeviceListItem): boolean {
  return Boolean(
    (device.ieeeAddr && device.ieeeAddr.length > 0) ||
      (device.protocolAddress && device.protocolAddress.length > 0)
  );
}

/**
 * Тело zigbee:subscribe / zigbee:unsubscribe (частичная отписка).
 * Лимит 200 на массив соблюдается здесь.
 */
export function buildZigbeeSubscribePayload(devices: ZigbeeDeviceListItem[]): {
  deviceIeeeAddrs: string[];
  physicalDeviceIds: string[];
} {
  const ieee = new Set<string>();
  const ids = new Set<string>();

  for (const d of devices) {
    if (MONGO_OBJECT_ID_RE.test(d.id)) ids.add(d.id);
    if (d.physicalDeviceId && MONGO_OBJECT_ID_RE.test(d.physicalDeviceId)) {
      ids.add(d.physicalDeviceId);
    }
    if (isZigbeeDevice(d)) {
      const addr = zigbeeAddress(d).trim();
      if (addr.length >= 3) ieee.add(addr);
    }
  }

  return {
    deviceIeeeAddrs: [...ieee].slice(0, 200),
    physicalDeviceIds: [...ids].slice(0, 200),
  };
}

export function stableZigbeeSubscribeKey(payload: {
  deviceIeeeAddrs: string[];
  physicalDeviceIds: string[];
}): string {
  return JSON.stringify({
    i: [...payload.deviceIeeeAddrs].sort(),
    p: [...payload.physicalDeviceIds].sort(),
  });
}

export function resolveZigbeeStateForDevice(
  map: ReadonlyMap<string, ZigbeeStateWire>,
  device: ZigbeeDeviceListItem
): ZigbeeStateWire | undefined {
  const byId = map.get(device.id);
  if (byId) return byId;
  if (device.physicalDeviceId) {
    const byPid = map.get(device.physicalDeviceId);
    if (byPid) return byPid;
  }
  return map.get(zigbeeAddress(device));
}
